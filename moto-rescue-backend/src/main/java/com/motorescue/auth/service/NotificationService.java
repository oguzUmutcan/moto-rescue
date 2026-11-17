package com.motorescue.auth.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.FieldValue;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.GeoPoint;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.motorescue.auth.dto.RescueDtos.RescueResponse;
import com.motorescue.auth.service.NotificationInboxService.InboxMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

@Service
@ConditionalOnProperty(name = "firebase.enabled", havingValue = "true", matchIfMissing = true)
public class NotificationService {
    private static final Logger LOGGER = LoggerFactory.getLogger(NotificationService.class);
    private static final URI EXPO_PUSH_URL = URI.create("https://exp.host/--/api/v2/push/send");
    private static final URI EXPO_RECEIPTS_URL = URI.create("https://exp.host/--/api/v2/push/getReceipts");
    private static final String RECEIPTS_COLLECTION = "pushNotificationReceipts";
    private static final String ACTIVE_RESCUES_COLLECTION = "activeRescueParticipants";
    private static final Duration RECEIPT_DELAY = Duration.ofMinutes(15);
    private static final Duration RECEIPT_EXPIRY = Duration.ofHours(24);

    private final Firestore firestore;
    private final NotificationInboxService notificationInboxService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient;

    public NotificationService(Firestore firestore, NotificationInboxService notificationInboxService) {
        this.firestore = firestore;
        this.notificationInboxService = notificationInboxService;
        this.httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
    }

    @Async("notificationExecutor")
    public void notifyNearbyBikers(RescueResponse rescue) {
        GeoPoint pickup = new GeoPoint(rescue.latitude(), rescue.longitude());
        try {
            List<DocumentSnapshot> nearbyBikers = firestore.collection("users")
                    .whereEqualTo("role", "biker")
                    .whereEqualTo("online", true)
                    .limit(100)
                    .get().get().getDocuments().stream()
                    .filter(biker -> isNearbyAvailableBiker(biker, pickup))
                    .map(document -> (DocumentSnapshot) document)
                    .toList();
            DocumentReference[] lockReferences = nearbyBikers.stream()
                    .map(biker -> firestore.collection(ACTIVE_RESCUES_COLLECTION).document(biker.getId()))
                    .toArray(DocumentReference[]::new);
            Set<String> activeBikerIds = lockReferences.length == 0
                    ? Set.of()
                    : firestore.getAll(lockReferences).get().stream()
                            .filter(DocumentSnapshot::exists)
                            .map(DocumentSnapshot::getId)
                            .collect(Collectors.toSet());
            List<DocumentSnapshot> recipients = nearbyBikers.stream()
                    .filter(biker -> !activeBikerIds.contains(biker.getId()))
                    .toList();
            List<InboxMessage> inboxMessages = recipients.stream()
                    .map(biker -> new InboxMessage(
                            biker.getId(),
                            "rescue_request",
                            "biker",
                            rescue.id(),
                            localized(biker.getString("language"), "New rescue nearby"),
                            rescue.pickupLabel()
                    ))
                    .toList();
            notificationInboxService.saveAll(inboxMessages);
            List<PushMessage> messages = recipients.stream()
                    .filter(this::acceptsNotifications)
                    .map(biker -> new PushMessage(
                            biker.getId(),
                            biker.getString("expoPushToken"),
                            localized(biker.getString("language"), "New rescue nearby"),
                            rescue.pickupLabel(),
                            Map.of("type", "rescue_request", "role", "biker", "requestId", rescue.id())
                    ))
                    .toList();
            sendBatch(messages);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            LOGGER.warn("Interrupted while sending rescue request notifications", exception);
        } catch (ExecutionException exception) {
            LOGGER.warn("Could not load biker push recipients", exception);
        }
    }

    @Async("notificationExecutor")
    public void notifyPassengerAccepted(RescueResponse rescue) {
        sendToUser(
                rescue.passengerId(),
                "Biker accepted your request",
                rescue.bikerName() == null ? "Your biker is on the way." : rescue.bikerName() + " is on the way.",
                Map.of("type", "rescue_accepted", "role", "passenger", "requestId", rescue.id())
        );
    }

    @Async("notificationExecutor")
    public void notifyPassengerStarted(RescueResponse rescue) {
        sendToUser(
                rescue.passengerId(),
                "Ride started",
                "Your rescue ride is now in progress.",
                Map.of("type", "rescue_started", "role", "passenger", "requestId", rescue.id())
        );
    }

    @Async("notificationExecutor")
    public void notifyPassengerCompleted(RescueResponse rescue) {
        sendToUser(
                rescue.passengerId(),
                "Ride completed",
                "Please review your biker when you have a moment.",
                Map.of("type", "rescue_completed", "role", "passenger", "requestId", rescue.id())
        );
    }

    @Async("notificationExecutor")
    public void notifyBikerCancelled(RescueResponse rescue) {
        if (rescue.bikerId() == null) return;
        sendToUser(
                rescue.bikerId(),
                "Rescue cancelled",
                "The passenger cancelled this rescue request.",
                Map.of("type", "rescue_cancelled", "role", "biker", "requestId", rescue.id())
        );
    }

    static boolean isNearbyAvailableBiker(DocumentSnapshot biker, GeoPoint pickup) {
        return isNearbyAvailableBiker(biker, pickup, Instant.now());
    }

    static boolean isNearbyAvailableBiker(DocumentSnapshot biker, GeoPoint pickup, Instant now) {
        Object availableDaysRaw = biker.get("availableDays");
        if (availableDaysRaw instanceof List<?> availableDays && availableDays.size() == 7) {
            int dayIndex = now.atZone(ZoneId.of("Europe/Istanbul")).getDayOfWeek().getValue() - 1;
            if (!Boolean.TRUE.equals(availableDays.get(dayIndex))) {
                return false;
            }
        }
        GeoPoint location = (GeoPoint) biker.get("currentLocation");
        Timestamp updatedAt = biker.getTimestamp("locationUpdatedAt");
        return location != null
                && RescueService.isFreshLocation(updatedAt, now)
                && RescueService.distanceKm(location, pickup) <= 6.0;
    }

    private void sendToUser(String uid, String title, String body, Map<String, Object> data) {
        try {
            DocumentSnapshot user = firestore.collection("users").document(uid).get().get();
            if (!user.exists()) return;
            String language = user.getString("language");
            String localizedTitle = localized(language, title);
            String localizedBody = localized(language, body);
            notificationInboxService.save(new InboxMessage(
                    uid,
                    (String) data.get("type"),
                    (String) data.get("role"),
                    (String) data.get("requestId"),
                    localizedTitle,
                    localizedBody
            ));
            if (!acceptsNotifications(user)) return;
            sendBatch(List.of(new PushMessage(
                    uid,
                    user.getString("expoPushToken"),
                    localizedTitle,
                    localizedBody,
                    data
            )));
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            LOGGER.warn("Interrupted while loading push recipient {}", uid, exception);
        } catch (ExecutionException exception) {
            LOGGER.warn("Could not load push recipient {}", uid, exception);
        }
    }

    private boolean acceptsNotifications(DocumentSnapshot user) {
        String token = user.getString("expoPushToken");
        return token != null
                && !token.isBlank()
                && !Boolean.FALSE.equals(user.getBoolean("notificationsEnabled"));
    }

    private void sendBatch(List<PushMessage> messages) {
        for (int start = 0; start < messages.size(); start += 100) {
            sendChunk(messages.subList(start, Math.min(start + 100, messages.size())));
        }
    }

    private void sendChunk(List<PushMessage> messages) {
        if (messages.isEmpty()) return;
        try {
            List<Map<String, Object>> payloadMessages = messages.stream()
                    .map(message -> {
                        Map<String, Object> payload = new HashMap<>();
                        payload.put("to", message.expoPushToken());
                        payload.put("title", message.title());
                        payload.put("body", message.body());
                        payload.put("sound", "default");
                        payload.put("data", message.data());
                        return payload;
                    })
                    .toList();
            String payload = objectMapper.writeValueAsString(payloadMessages);
            HttpRequest request = HttpRequest.newBuilder(EXPO_PUSH_URL)
                    .timeout(Duration.ofSeconds(8))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(payload))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                LOGGER.warn("Expo push failed with status {}: {}", response.statusCode(), response.body());
                return;
            }

            List<PushResult> tickets = parsePushTickets(response.body());
            for (int index = 0; index < messages.size(); index++) {
                PushMessage message = messages.get(index);
                PushResult ticket = index < tickets.size()
                        ? tickets.get(index)
                        : new PushResult(null, "Expo omitted a push ticket", "MalformedExpoResponse");
                if (ticket.error() != null) {
                    LOGGER.warn("Expo rejected push for user {}: {} ({})",
                            message.uid(), ticket.message(), ticket.error());
                    if ("DeviceNotRegistered".equals(ticket.error())) {
                        removeTokenIfCurrent(message.uid(), message.expoPushToken());
                    }
                } else if (ticket.ticketId() != null) {
                    savePendingReceipt(ticket.ticketId(), message.uid(), message.expoPushToken());
                }
            }
        } catch (JsonProcessingException exception) {
            LOGGER.warn("Could not serialize or parse Expo push data", exception);
        } catch (IOException exception) {
            LOGGER.warn("Could not send Expo push notification", exception);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            LOGGER.warn("Interrupted while sending Expo push notification", exception);
        } catch (ExecutionException exception) {
            LOGGER.warn("Could not persist Expo push ticket or remove a stale token", exception);
        }
    }

    @Scheduled(fixedDelayString = "${notifications.receipt-check-ms:60000}")
    public void checkPushReceipts() {
        Instant now = Instant.now();
        try {
            List<QueryDocumentSnapshot> pending = firestore.collection(RECEIPTS_COLLECTION)
                    .whereLessThanOrEqualTo("checkAfter", timestamp(now))
                    .limit(1000)
                    .get().get().getDocuments();
            if (pending.isEmpty()) return;

            List<String> ticketIds = new ArrayList<>();
            for (QueryDocumentSnapshot document : pending) {
                Timestamp createdAt = document.getTimestamp("createdAt");
                if (createdAt != null && createdAt.toDate().toInstant().isBefore(now.minus(RECEIPT_EXPIRY))) {
                    document.getReference().delete().get();
                } else {
                    ticketIds.add(document.getId());
                }
            }
            if (ticketIds.isEmpty()) return;

            String payload = objectMapper.writeValueAsString(Map.of("ids", ticketIds));
            HttpRequest request = HttpRequest.newBuilder(EXPO_RECEIPTS_URL)
                    .timeout(Duration.ofSeconds(8))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(payload))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                LOGGER.warn("Expo receipt lookup failed with status {}: {}", response.statusCode(), response.body());
                return;
            }

            Map<String, PushResult> receipts = parsePushReceipts(response.body());
            for (QueryDocumentSnapshot document : pending) {
                PushResult receipt = receipts.get(document.getId());
                if (receipt == null) continue;
                if (receipt.error() != null) {
                    LOGGER.warn("Expo could not deliver push ticket {}: {} ({})",
                            document.getId(), receipt.message(), receipt.error());
                    if ("DeviceNotRegistered".equals(receipt.error())) {
                        removeTokenIfCurrent(document.getString("uid"), document.getString("expoPushToken"));
                    }
                }
                document.getReference().delete().get();
            }
        } catch (JsonProcessingException exception) {
            LOGGER.warn("Could not serialize or parse Expo receipt data", exception);
        } catch (IOException exception) {
            LOGGER.warn("Could not query Expo push receipts", exception);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            LOGGER.warn("Interrupted while checking Expo push receipts", exception);
        } catch (ExecutionException exception) {
            LOGGER.warn("Could not load pending Expo push receipts", exception);
        }
    }

    private void savePendingReceipt(String ticketId, String uid, String expoPushToken)
            throws ExecutionException, InterruptedException {
        Instant now = Instant.now();
        Map<String, Object> receipt = Map.of(
                "uid", uid,
                "expoPushToken", expoPushToken,
                "createdAt", timestamp(now),
                "checkAfter", timestamp(now.plus(RECEIPT_DELAY))
        );
        firestore.collection(RECEIPTS_COLLECTION).document(ticketId).set(receipt).get();
    }

    private void removeTokenIfCurrent(String uid, String rejectedToken)
            throws ExecutionException, InterruptedException {
        if (uid == null || rejectedToken == null) return;
        DocumentReference user = firestore.collection("users").document(uid);
        firestore.runTransaction(transaction -> {
            DocumentSnapshot current = transaction.get(user).get();
            if (rejectedToken.equals(current.getString("expoPushToken"))) {
                transaction.update(user, Map.of(
                        "expoPushToken", FieldValue.delete(),
                        "pushTokenUpdatedAt", Timestamp.now()
                ));
            }
            return null;
        }).get();
    }

    static PushResult parsePushTicket(String responseBody) throws JsonProcessingException {
        List<PushResult> tickets = parsePushTickets(responseBody);
        return tickets.isEmpty()
                ? new PushResult(null, "Expo omitted a push ticket", "MalformedExpoResponse")
                : tickets.getFirst();
    }

    static List<PushResult> parsePushTickets(String responseBody) throws JsonProcessingException {
        JsonNode data = new ObjectMapper().readTree(responseBody).path("data");
        List<PushResult> tickets = new ArrayList<>();
        if (data.isArray()) {
            data.forEach(ticket -> tickets.add(parseResult(ticket)));
        } else if (!data.isMissingNode()) {
            tickets.add(parseResult(data));
        }
        return tickets;
    }

    static Map<String, PushResult> parsePushReceipts(String responseBody) throws JsonProcessingException {
        JsonNode data = new ObjectMapper().readTree(responseBody).path("data");
        Map<String, PushResult> receipts = new HashMap<>();
        data.fields().forEachRemaining(entry -> receipts.put(entry.getKey(), parseResult(entry.getValue())));
        return receipts;
    }

    private static PushResult parseResult(JsonNode node) {
        String status = textOrNull(node, "status");
        String ticketId = textOrNull(node, "id");
        String message = textOrNull(node, "message");
        String error = textOrNull(node.path("details"), "error");
        if (!"ok".equals(status) && error == null) {
            error = status == null ? "MalformedExpoResponse" : "UnknownExpoError";
        }
        return new PushResult(ticketId, message, error);
    }

    private static String textOrNull(JsonNode node, String field) {
        JsonNode value = node.path(field);
        return value.isTextual() ? value.textValue() : null;
    }

    private static Timestamp timestamp(Instant instant) {
        return Timestamp.ofTimeSecondsAndNanos(instant.getEpochSecond(), instant.getNano());
    }

    record PushResult(String ticketId, String message, String error) {
    }

    private record PushMessage(
            String uid,
            String expoPushToken,
            String title,
            String body,
            Map<String, Object> data
    ) {
    }

    static String localized(String language, String message) {
        if (!"tr".equals(language) || message == null) return message;
        return switch (message) {
            case "New rescue nearby" -> "Yakında yeni yardım talebi";
            case "Biker accepted your request" -> "Motosikletçi talebinizi kabul etti";
            case "Your biker is on the way." -> "Motosikletçiniz yolda.";
            case "Ride started" -> "Yolculuk başladı";
            case "Your rescue ride is now in progress." -> "Yardım yolculuğunuz başladı.";
            case "Ride completed" -> "Yolculuk tamamlandı";
            case "Please review your biker when you have a moment." ->
                    "Uygun olduğunuzda motosikletçinizi değerlendirin.";
            case "Rescue cancelled" -> "Yardım iptal edildi";
            case "The passenger cancelled this rescue request." -> "Yolcu yardım talebini iptal etti.";
            default -> message.endsWith(" is on the way.")
                    ? message.substring(0, message.length() - " is on the way.".length()) + " yolda."
                    : message;
        };
    }
}
