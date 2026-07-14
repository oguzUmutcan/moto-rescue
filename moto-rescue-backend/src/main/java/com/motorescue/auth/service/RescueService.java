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
import org.springframework.http.HttpStatus;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@Service
@ConditionalOnProperty(name = "firebase.enabled", havingValue = "true", matchIfMissing = true)
public class RescueService {

    private static final String REQUESTS = "rescueRequests";
    private static final String USERS = "users";
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
        data.put("createdAt", Timestamp.ofTimeSecondsAndNanos(now.getEpochSecond(), now.getNano()));
        Instant expiresAt = now.plusSeconds(300);
        data.put("expiresAt", Timestamp.ofTimeSecondsAndNanos(expiresAt.getEpochSecond(), expiresAt.getNano()));
        await(reference.create(data));
        return from(reference.getId(), data);
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
        return from(snapshot);
    }

    public List<RescueResponse> open(FirebaseToken token) {
        requireRole(token.getUid(), "biker");
        try {
            return firestore.collection(REQUESTS)
                    .whereEqualTo("status", "searching")
                    .limit(10)
                    .get().get().getDocuments().stream()
                    .filter(document -> !isExpired(document))
                    .map(this::from)
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
                transaction.update(reference, Map.of(
                        "status", "accepted",
                        "bikerId", token.getUid(),
                        "bikerName", displayName(token),
                        "acceptedAt", Timestamp.now()
                ));
                return null;
            }).get();
            return from(getDocument(requestId));
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
            return from(getDocument(requestId));
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

    public RescueResponse start(FirebaseToken token, String requestId) {
        return transitionByBiker(token, requestId, "accepted", "in_progress", "startedAt");
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
            return from(getDocument(requestId));
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
                instant((Timestamp) data.get("createdAt")),
                instant((Timestamp) data.get("expiresAt")),
                instant((Timestamp) data.get("acceptedAt")),
                instant((Timestamp) data.get("startedAt")),
                instant((Timestamp) data.get("completedAt"))
        );
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
