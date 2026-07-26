package com.motorescue.auth.service;

import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.motorescue.auth.dto.PublicBikerDtos.PublicBikerProfile;
import com.motorescue.auth.dto.PublicBikerDtos.PublicBikerReview;
import com.motorescue.auth.dto.PublicBikerDtos.PublicBikerSummary;
import com.motorescue.auth.dto.PublicBikerDtos.PublicRescueHistory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.ExecutionException;

@Service
@ConditionalOnProperty(name = "firebase.enabled", havingValue = "true", matchIfMissing = true)
public class PublicBikerService {
    private final Firestore firestore;

    public PublicBikerService(Firestore firestore) {
        this.firestore = firestore;
    }

    public List<PublicBikerSummary> search(String query) {
        String normalizedQuery = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
        if (normalizedQuery.length() > 80) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Search query is too long");
        }
        try {
            return firestore.collection("users")
                    .whereEqualTo("role", "biker")
                    .limit(200)
                    .get().get().getDocuments().stream()
                    .filter(this::isPublicBiker)
                    .filter(document -> normalizedQuery.isEmpty()
                            || safeName(document).toLowerCase(Locale.ROOT).contains(normalizedQuery))
                    .map(this::summary)
                    .sorted((left, right) -> {
                        int ratingOrder = Double.compare(right.rating(), left.rating());
                        return ratingOrder != 0 ? ratingOrder : left.name().compareToIgnoreCase(right.name());
                    })
                    .limit(50)
                    .toList();
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw unavailable(exception);
        } catch (ExecutionException exception) {
            throw unavailable(exception);
        }
    }

    public PublicBikerProfile get(String bikerId) {
        try {
            DocumentSnapshot biker = firestore.collection("users").document(bikerId).get().get();
            if (!biker.exists() || !isPublicBiker(biker)) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Biker profile not found");
            }

            List<PublicBikerReview> reviews = firestore.collection("reviews")
                    .whereEqualTo("bikerId", bikerId)
                    .limit(100)
                    .get().get().getDocuments().stream()
                    .map(document -> new PublicBikerReview(
                            document.getId(),
                            anonymizedPassengerName(resolvedPassengerName(document)),
                            number(document, "rating").intValue(),
                            document.getString("comment"),
                            instant(document.getTimestamp("createdAt"))
                    ))
                    .sorted((left, right) -> compareNewest(left.createdAt(), right.createdAt()))
                    .toList();

            List<PublicRescueHistory> history = firestore.collection("rescueRequests")
                    .whereEqualTo("bikerId", bikerId)
                    .limit(100)
                    .get().get().getDocuments().stream()
                    .filter(document -> "completed".equals(document.getString("status")))
                    .map(document -> new PublicRescueHistory(
                            document.getString("urgency"),
                            Boolean.TRUE.equals(document.getBoolean("needsHelmet")),
                            instant(document.getTimestamp("completedAt"))
                    ))
                    .sorted((left, right) -> compareNewest(left.completedAt(), right.completedAt()))
                    .toList();

            return new PublicBikerProfile(summary(biker), reviews, history);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw unavailable(exception);
        } catch (ExecutionException exception) {
            throw unavailable(exception);
        }
    }

    private boolean isPublicBiker(DocumentSnapshot document) {
        return "biker".equals(document.getString("role"))
                && "verified".equals(document.getString("identityDocumentStatus"));
    }

    private PublicBikerSummary summary(DocumentSnapshot document) {
        return new PublicBikerSummary(
                document.getId(),
                safeName(document),
                document.getString("profilePhotoPath"),
                document.getString("bio"),
                document.getString("motorcycleModel"),
                document.getString("motorcycleColor"),
                number(document, "rating").doubleValue(),
                number(document, "ratingCount").longValue(),
                number(document, "totalRescues").longValue()
        );
    }

    private String safeName(DocumentSnapshot document) {
        String name = document.getString("name");
        return name == null || name.isBlank() ? "MotoRescue biker" : name;
    }

    static String anonymizedPassengerName(String name) {
        if (name == null || name.isBlank()) return "Passenger";
        String firstName = name.trim().split("\\s+")[0];
        return firstName.length() <= 1 ? firstName : firstName.charAt(0) + "***";
    }

    private String resolvedPassengerName(DocumentSnapshot review) {
        String storedName = review.getString("passengerName");
        if (storedName != null && !storedName.isBlank() && !"user".equalsIgnoreCase(storedName.trim())) {
            return storedName;
        }
        String passengerId = review.getString("passengerId");
        if (passengerId == null || passengerId.isBlank()) return storedName;
        try {
            DocumentSnapshot passenger = firestore.collection("users").document(passengerId).get().get();
            return passenger.exists() ? passenger.getString("name") : storedName;
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw unavailable(exception);
        } catch (ExecutionException exception) {
            throw unavailable(exception);
        }
    }

    private Number number(DocumentSnapshot document, String field) {
        Number value = (Number) document.get(field);
        return value == null ? 0 : value;
    }

    private Instant instant(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toDate().toInstant();
    }

    private int compareNewest(Instant left, Instant right) {
        if (left == null && right == null) return 0;
        if (left == null) return 1;
        if (right == null) return -1;
        return right.compareTo(left);
    }

    private ResponseStatusException unavailable(Exception exception) {
        return new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Firestore operation failed", exception);
    }
}
