package com.motorescue.auth.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.GeoPoint;
import com.motorescue.auth.dto.RescueDtos.RescueResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@Service
@ConditionalOnProperty(name = "firebase.enabled", havingValue = "true", matchIfMissing = true)
public class NotificationService {
    private static final Logger LOGGER = LoggerFactory.getLogger(NotificationService.class);
    private static final URI EXPO_PUSH_URL = URI.create("https://exp.host/--/api/v2/push/send");

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
            send(user.getString("expoPushToken"), title, body, data);
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

    private void send(String expoPushToken, String title, String body, Map<String, Object> data) {
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
            }
        } catch (JsonProcessingException exception) {
            LOGGER.warn("Could not serialize Expo push payload", exception);
        } catch (IOException exception) {
            LOGGER.warn("Could not send Expo push notification", exception);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            LOGGER.warn("Interrupted while sending Expo push notification", exception);
        }
    }
}
