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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@Service
@ConditionalOnProperty(name = "firebase.enabled", havingValue = "true", matchIfMissing = true)
public class NotificationService {
    private static final Logger LOGGER = LoggerFactory.getLogger(NotificationService.class);
    private static final URI EXPO_PUSH_URL = URI.create("https://exp.host/--/api/v2/push/send");
    private static final URI EXPO_RECEIPTS_URL = URI.create("https://exp.host/--/api/v2/push/getReceipts");
    private static final String RECEIPTS_COLLECTION = "pushNotificationReceipts";
    private static final Duration RECEIPT_DELAY = Duration.ofMinutes(15);
    private static final Duration RECEIPT_EXPIRY = Duration.ofHours(24);

    private final Firestore firestore;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient;

    public NotificationService(Firestore firestore) {
        this.firestore = firestore;
        this.httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
    }

    public void notifyNearbyBikers(RescueResponse rescue) {
        GeoPoint pickup = new GeoPoint(rescue.latitude(), rescue.longitude());
        try {
            firestore.collection("users")
                    .whereEqualTo("role", "biker")
                    .whereEqualTo("online", true)
                    .limit(100)
                    .get().get().getDocuments().stream()
                    .filter(this::acceptsNotifications)
                    .filter(biker -> isNearbyAvailableBiker(biker, pickup))
                    .forEach(biker -> send(
                            biker.getId(),
                            biker.getString("expoPushToken"),
                            "New rescue nearby",
                            rescue.pickupLabel(),
                            Map.of("type", "rescue_request", "role", "biker", "requestId", rescue.id())
                    ));
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            LOGGER.warn("Interrupted while sending rescue request notifications", exception);
        } catch (ExecutionException exception) {
            LOGGER.warn("Could not load biker push recipients", exception);
        }
    }

    public void notifyPassengerAccepted(RescueResponse rescue) {
        sendToUser(
                rescue.passengerId(),
                "Biker accepted your request",
                rescue.bikerName() == null ? "Your biker is on the way." : rescue.bikerName() + " is on the way.",
                Map.of("type", "rescue_accepted", "role", "passenger", "requestId", rescue.id())
        );
    }

    public void notifyPassengerStarted(RescueResponse rescue) {
        sendToUser(
                rescue.passengerId(),
                "Ride started",
                "Your rescue ride is now in progress.",
                Map.of("type", "rescue_started", "role", "passenger", "requestId", rescue.id())
        );
    }

    public void notifyPassengerCompleted(RescueResponse rescue) {
        sendToUser(
                rescue.passengerId(),
                "Ride completed",
                "Please review your biker when you have a moment.",
                Map.of("type", "rescue_completed", "role", "passenger", "requestId", rescue.id())
        );
    }

    public void notifyBikerCancelled(RescueResponse rescue) {
        if (rescue.bikerId() == null) return;
        sendToUser(
                rescue.bikerId(),
                "Rescue cancelled",
                "The passenger cancelled this rescue request.",
                Map.of("type", "rescue_cancelled", "role", "biker", "requestId", rescue.id())
        );
    }

    private boolean isNearbyAvailableBiker(DocumentSnapshot biker, GeoPoint pickup) {
        GeoPoint location = (GeoPoint) biker.get("currentLocation");
        Timestamp updatedAt = biker.getTimestamp("locationUpdatedAt");
        return location != null
                && RescueService.isFreshLocation(updatedAt, Instant.now())
                && RescueService.distanceKm(location, pickup) <= 6.0;
    }

    private void sendToUser(String uid, String title, String body, Map<String, Object> data) {
        try {
            DocumentSnapshot user = firestore.collection("users").document(uid).get().get();
            if (!user.exists() || !acceptsNotifications(user)) return;
            send(uid, user.getString("expoPushToken"), title, body, data);
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

    private void send(String uid, String expoPushToken, String title, String body, Map<String, Object> data) {
        if (expoPushToken == null || expoPushToken.isBlank()) return;
        Map<String, Object> message = new HashMap<>();
        message.put("to", expoPushToken);
        message.put("title", title);
        message.put("body", body);
        message.put("sound", "default");
        message.put("data", data);

        try {
            String payload = objectMapper.writeValueAsString(List.of(message));
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

            PushResult ticket = parsePushTicket(response.body());
            if (ticket.error() != null) {
                LOGGER.warn("Expo rejected push for user {}: {} ({})", uid, ticket.message(), ticket.error());
                if ("DeviceNotRegistered".equals(ticket.error())) {
                    removeTokenIfCurrent(uid, expoPushToken);
                }
            } else if (ticket.ticketId() != null) {
                savePendingReceipt(ticket.ticketId(), uid, expoPushToken);
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
        JsonNode data = new ObjectMapper().readTree(responseBody).path("data");
        JsonNode ticket = data.isArray() ? data.path(0) : data;
        return parseResult(ticket);
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
}
