package com.motorescue.auth.service;

import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.FieldValue;
import com.google.cloud.firestore.GeoPoint;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.firebase.auth.FirebaseToken;
import com.motorescue.auth.dto.RescueDtos.CreateRescueRequest;
import com.motorescue.auth.dto.RescueDtos.RescueResponse;
import com.motorescue.auth.dto.RescueDtos.StartRescueRequest;
import org.springframework.http.HttpStatus;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.security.SecureRandom;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@Service
@ConditionalOnProperty(name = "firebase.enabled", havingValue = "true", matchIfMissing = true)
public class RescueService {

    private static final String REQUESTS = "rescueRequests";
    private static final String USERS = "users";
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final double ZONE_KM = 6.0;
    private final Firestore firestore;

    public RescueService(Firestore firestore) {
        this.firestore = firestore;
    }

    public RescueResponse create(FirebaseToken token, CreateRescueRequest request) {
        requireRole(token.getUid(), "passenger");
        Instant now = Instant.now();
        DocumentReference reference = firestore.collection(REQUESTS).document();
        Map<String, Object> data = new HashMap<>();
        data.put("passengerId", token.getUid());
        data.put("passengerName", displayName(token));
        data.put("pickup", new GeoPoint(request.latitude(), request.longitude()));
        data.put("pickupLabel", request.pickupLabel().trim());
        data.put("destinationLabel", request.destinationLabel().trim());
        data.put("destination", new GeoPoint(request.destinationLatitude(), request.destinationLongitude()));
        data.put("urgency", request.urgency().trim());
        data.put("needsHelmet", request.needsHelmet());
        data.put("status", "searching");
        data.put("bikerId", null);
        data.put("bikerName", null);
        data.put("bikerProfilePhotoPath", null);
        data.put("bikerPhoneNumber", null);
        data.put("createdAt", Timestamp.ofTimeSecondsAndNanos(now.getEpochSecond(), now.getNano()));
        Instant expiresAt = now.plusSeconds(300);
        data.put("expiresAt", Timestamp.ofTimeSecondsAndNanos(expiresAt.getEpochSecond(), expiresAt.getNano()));
        await(reference.create(data));
        return forUser(token, from(reference.getId(), data));
    }

    public RescueResponse get(FirebaseToken token, String requestId) {
        DocumentSnapshot snapshot = getDocument(requestId);
        String passengerId = snapshot.getString("passengerId");
        String bikerId = snapshot.getString("bikerId");
        boolean participant = token.getUid().equals(passengerId) || token.getUid().equals(bikerId);
        boolean availableToBiker = "searching".equals(snapshot.getString("status"))
                && !isExpired(snapshot)
                && hasRole(token.getUid(), "biker");
        if (!participant && !availableToBiker) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not a participant in this rescue");
        }
        return forUser(token, from(snapshot));
    }

    public List<RescueResponse> open(FirebaseToken token) {
        requireRole(token.getUid(), "biker");
        DocumentSnapshot biker = userProfile(token.getUid());
        GeoPoint bikerLocation = (GeoPoint) biker.get("currentLocation");
        if (!Boolean.TRUE.equals(biker.getBoolean("online")) || bikerLocation == null
                || !isFreshLocation(biker.getTimestamp("locationUpdatedAt"), Instant.now())) return List.of();
        try {
            return firestore.collection(REQUESTS)
                    .whereEqualTo("status", "searching")
                    .limit(10)
                    .get().get().getDocuments().stream()
                    .filter(document -> !isExpired(document))
                    .filter(document -> distanceKm(bikerLocation, (GeoPoint) document.get("pickup")) <= ZONE_KM)
                    .map(this::from)
                    .map(response -> forUser(token, response))
                    .toList();
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw unavailable(exception);
        } catch (ExecutionException exception) {
            throw unavailable(exception);
        }
    }

    public List<RescueResponse> history(FirebaseToken token) {
        DocumentSnapshot user = userProfile(token.getUid());
        String role = user.getString("role");
        String ownerField = "biker".equals(role) ? "bikerId" : "passengerId";
        try {
            return firestore.collection(REQUESTS)
                    .whereEqualTo(ownerField, token.getUid())
                    .limit(100)
                    .get().get().getDocuments().stream()
                    .map(this::from)
                    .map(response -> forUser(token, response))
                    .sorted((left, right) -> right.createdAt().compareTo(left.createdAt()))
                    .toList();
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw unavailable(exception);
        } catch (ExecutionException exception) {
            throw unavailable(exception);
        }
    }

    public RescueResponse active(FirebaseToken token) {
        DocumentSnapshot user = userProfile(token.getUid());
        String role = user.getString("role");
        String ownerField = "biker".equals(role) ? "bikerId" : "passengerId";
        try {
            return firestore.collection(REQUESTS)
                    .whereEqualTo(ownerField, token.getUid())
                    .limit(100)
                    .get().get().getDocuments().stream()
                    .filter(document -> {
                        String status = document.getString("status");
                        return "searching".equals(status) || "accepted".equals(status) || "in_progress".equals(status);
                    })
                    .filter(document -> !"searching".equals(document.getString("status")) || !isExpired(document))
                    .map(this::from)
                    .map(response -> forUser(token, response))
                    .max((left, right) -> left.createdAt().compareTo(right.createdAt()))
                    .orElse(null);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw unavailable(exception);
        } catch (ExecutionException exception) {
            throw unavailable(exception);
        }
    }

    public RescueResponse accept(FirebaseToken token, String requestId) {
        requireRole(token.getUid(), "biker");
        DocumentSnapshot biker = userProfile(token.getUid());
        GeoPoint bikerLocation = (GeoPoint) biker.get("currentLocation");
        if (bikerLocation == null || !isFreshLocation(biker.getTimestamp("locationUpdatedAt"), Instant.now()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A recent biker location is required");
        DocumentReference reference = firestore.collection(REQUESTS).document(requestId);
        try {
            firestore.runTransaction(transaction -> {
                DocumentSnapshot snapshot = transaction.get(reference).get();
                if (!snapshot.exists()) {
                    throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Rescue request not found");
                }
                if (!"searching".equals(snapshot.getString("status")) || isExpired(snapshot)) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Rescue request is no longer available");
                }
                if (distanceKm(bikerLocation, (GeoPoint) snapshot.get("pickup")) > ZONE_KM) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Rescue is outside the 6 km zone");
                }
                Map<String, Object> acceptance = new HashMap<>();
                acceptance.put("status", "accepted");
                acceptance.put("bikerId", token.getUid());
                acceptance.put("bikerName", displayName(token));
                acceptance.put("bikerProfilePhotoPath", biker.getString("profilePhotoPath"));
                acceptance.put("bikerPhoneNumber", biker.getString("phone"));
                acceptance.put("boardingCode", String.format("%06d", SECURE_RANDOM.nextInt(1_000_000)));
                acceptance.put("acceptedAt", Timestamp.now());
                transaction.update(reference, acceptance);
                return null;
            }).get();
            return forUser(token, from(getDocument(requestId)));
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw unavailable(exception);
        } catch (ExecutionException exception) {
            if (exception.getCause() instanceof ResponseStatusException statusException) {
                throw statusException;
            }
            throw unavailable(exception);
        }
    }

    public RescueResponse cancel(FirebaseToken token, String requestId) {
        DocumentReference reference = firestore.collection(REQUESTS).document(requestId);
        try {
            firestore.runTransaction(transaction -> {
                DocumentSnapshot snapshot = transaction.get(reference).get();
                if (!snapshot.exists()) {
                    throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Rescue request not found");
                }
                if (!token.getUid().equals(snapshot.getString("passengerId"))) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the passenger can cancel this rescue");
                }
                String status = snapshot.getString("status");
                if (!"searching".equals(status) && !"accepted".equals(status)) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Rescue request cannot be cancelled");
                }
                transaction.update(reference, "status", "cancelled");
                return null;
            }).get();
            return forUser(token, from(getDocument(requestId)));
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw unavailable(exception);
        } catch (ExecutionException exception) {
            if (exception.getCause() instanceof ResponseStatusException statusException) {
                throw statusException;
            }
            throw unavailable(exception);
        }
    }

    public RescueResponse start(FirebaseToken token, String requestId, StartRescueRequest request) {
        requireRole(token.getUid(), "biker");
        DocumentReference reference = firestore.collection(REQUESTS).document(requestId);
        try {
            firestore.runTransaction(transaction -> {
                DocumentSnapshot snapshot = transaction.get(reference).get();
                if (!snapshot.exists()) {
                    throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Rescue request not found");
                }
                if (!token.getUid().equals(snapshot.getString("bikerId"))) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the assigned biker can start this rescue");
                }
                if (!"accepted".equals(snapshot.getString("status"))) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Invalid rescue status transition");
                }
                if (!request.boardingCode().equals(snapshot.getString("boardingCode"))) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Boarding code is incorrect");
                }
                Timestamp now = Timestamp.now();
                transaction.update(reference, Map.of(
                        "status", "in_progress",
                        "boardingVerifiedAt", now,
                        "startedAt", now
                ));
                return null;
            }).get();
            return forUser(token, from(getDocument(requestId)));
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw unavailable(exception);
        } catch (ExecutionException exception) {
            if (exception.getCause() instanceof ResponseStatusException statusException) throw statusException;
            throw unavailable(exception);
        }
    }

    public RescueResponse complete(FirebaseToken token, String requestId) {
        return transitionByBiker(token, requestId, "in_progress", "completed", "completedAt");
    }

    private RescueResponse transitionByBiker(FirebaseToken token, String requestId,
                                              String expectedStatus, String nextStatus, String timestampField) {
        requireRole(token.getUid(), "biker");
        DocumentReference reference = firestore.collection(REQUESTS).document(requestId);
        try {
            firestore.runTransaction(transaction -> {
                DocumentSnapshot snapshot = transaction.get(reference).get();
                if (!snapshot.exists()) {
                    throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Rescue request not found");
                }
                if (!token.getUid().equals(snapshot.getString("bikerId"))) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the assigned biker can update this rescue");
                }
                if (!expectedStatus.equals(snapshot.getString("status"))) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Invalid rescue status transition");
                }
                transaction.update(reference, Map.of("status", nextStatus, timestampField, Timestamp.now()));
                if ("completed".equals(nextStatus)) {
                    transaction.update(firestore.collection(USERS).document(token.getUid()),
                            "totalRescues", FieldValue.increment(1));
                }
                return null;
            }).get();
            return forUser(token, from(getDocument(requestId)));
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw unavailable(exception);
        } catch (ExecutionException exception) {
            if (exception.getCause() instanceof ResponseStatusException statusException) throw statusException;
            throw unavailable(exception);
        }
    }

    private void requireRole(String uid, String expectedRole) {
        if (!hasRole(uid, expectedRole)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "The " + expectedRole + " role is required");
        }
    }

    private boolean hasRole(String uid, String expectedRole) {
        return expectedRole.equalsIgnoreCase(userProfile(uid).getString("role"));
    }

    private DocumentSnapshot userProfile(String uid) {
        try {
            DocumentSnapshot profile = firestore.collection(USERS).document(uid).get().get();
            if (!profile.exists()) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User profile is required");
            return profile;
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw unavailable(exception);
        } catch (ExecutionException exception) {
            throw unavailable(exception);
        }
    }

    private DocumentSnapshot getDocument(String requestId) {
        try {
            DocumentSnapshot snapshot = firestore.collection(REQUESTS).document(requestId).get().get();
            if (!snapshot.exists()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Rescue request not found");
            }
            return snapshot;
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw unavailable(exception);
        } catch (ExecutionException exception) {
            throw unavailable(exception);
        }
    }

    private boolean isExpired(DocumentSnapshot snapshot) {
        Timestamp expiresAt = snapshot.getTimestamp("expiresAt");
        return expiresAt != null && expiresAt.toDate().toInstant().isBefore(Instant.now());
    }

    private RescueResponse from(DocumentSnapshot snapshot) {
        return from(snapshot.getId(), snapshot.getData());
    }

    private RescueResponse from(String id, Map<String, Object> data) {
        GeoPoint pickup = (GeoPoint) data.get("pickup");
        GeoPoint destination = (GeoPoint) data.get("destination");
        GeoPoint bikerLocation = (GeoPoint) data.get("bikerLocation");
        return new RescueResponse(
                id,
                (String) data.get("passengerId"),
                (String) data.get("passengerName"),
                pickup.getLatitude(),
                pickup.getLongitude(),
                data.get("pickupLabel") == null
                        ? String.format("%.5f, %.5f", pickup.getLatitude(), pickup.getLongitude())
                        : (String) data.get("pickupLabel"),
                (String) data.get("destinationLabel"),
                destination == null ? 0 : destination.getLatitude(),
                destination == null ? 0 : destination.getLongitude(),
                (String) data.get("urgency"),
                Boolean.TRUE.equals(data.get("needsHelmet")),
                (String) data.get("status"),
                (String) data.get("bikerId"),
                (String) data.get("bikerName"),
                (String) data.get("bikerProfilePhotoPath"),
                (String) data.get("bikerPhoneNumber"),
                instant((Timestamp) data.get("createdAt")),
                instant((Timestamp) data.get("expiresAt")),
                instant((Timestamp) data.get("acceptedAt")),
                (String) data.get("boardingCode"),
                instant((Timestamp) data.get("boardingVerifiedAt")),
                instant((Timestamp) data.get("startedAt")),
                instant((Timestamp) data.get("completedAt")),
                bikerLocation == null ? null : bikerLocation.getLatitude(),
                bikerLocation == null ? null : bikerLocation.getLongitude(),
                instant((Timestamp) data.get("bikerLocationUpdatedAt"))
        );
    }

    private RescueResponse forUser(FirebaseToken token, RescueResponse response) {
        boolean showBoardingCode = token.getUid().equals(response.passengerId())
                && "accepted".equals(response.status());
        if (showBoardingCode || response.boardingCode() == null) return response;
        return new RescueResponse(
                response.id(), response.passengerId(), response.passengerName(), response.latitude(), response.longitude(),
                response.pickupLabel(), response.destinationLabel(), response.destinationLatitude(), response.destinationLongitude(),
                response.urgency(), response.needsHelmet(), response.status(), response.bikerId(), response.bikerName(), response.bikerProfilePhotoPath(), response.bikerPhoneNumber(),
                response.createdAt(), response.expiresAt(), response.acceptedAt(), null, response.boardingVerifiedAt(),
                response.startedAt(), response.completedAt(), response.bikerLatitude(), response.bikerLongitude(), response.bikerLocationUpdatedAt()
        );
    }

    public void updateBikerLocation(FirebaseToken token, String requestId, double latitude, double longitude) {
        DocumentSnapshot rescue = getDocument(requestId);
        if (!token.getUid().equals(rescue.getString("bikerId"))) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the assigned biker can share location");
        String status = rescue.getString("status");
        if (!"accepted".equals(status) && !"in_progress".equals(status)) throw new ResponseStatusException(HttpStatus.CONFLICT, "Rescue is not active");
        await(firestore.collection(REQUESTS).document(requestId).update(Map.of("bikerLocation", new GeoPoint(latitude, longitude), "bikerLocationUpdatedAt", Timestamp.now())));
        updateUserLocation(token.getUid(), latitude, longitude);
    }

    private void updateUserLocation(String uid, double latitude, double longitude) {
        await(firestore.collection(USERS).document(uid).update(Map.of("currentLocation", new GeoPoint(latitude, longitude), "locationUpdatedAt", Timestamp.now())));
    }

    static double distanceKm(GeoPoint left, GeoPoint right) {
        double lat = Math.toRadians(right.getLatitude() - left.getLatitude());
        double lon = Math.toRadians(right.getLongitude() - left.getLongitude());
        double a = Math.pow(Math.sin(lat / 2), 2) + Math.cos(Math.toRadians(left.getLatitude())) * Math.cos(Math.toRadians(right.getLatitude())) * Math.pow(Math.sin(lon / 2), 2);
        return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    static boolean isFreshLocation(Timestamp updatedAt, Instant now) {
        return updatedAt != null && updatedAt.toDate().toInstant().plusSeconds(120).isAfter(now);
    }

    private Instant instant(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toDate().toInstant();
    }

    private String displayName(FirebaseToken token) {
        return token.getName() == null || token.getName().isBlank() ? "User" : token.getName();
    }

    private void await(com.google.api.core.ApiFuture<?> future) {
        try {
            future.get();
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw unavailable(exception);
        } catch (ExecutionException exception) {
            throw unavailable(exception);
        }
    }

    private ResponseStatusException unavailable(Exception exception) {
        return new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Firestore operation failed", exception);
    }
}
