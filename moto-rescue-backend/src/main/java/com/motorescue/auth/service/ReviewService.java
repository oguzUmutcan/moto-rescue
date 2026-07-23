package com.motorescue.auth.service;

import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.firebase.auth.FirebaseToken;
import com.motorescue.auth.dto.ReviewDtos.CreateReviewRequest;
import com.motorescue.auth.dto.ReviewDtos.ReviewResponse;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@Service
@ConditionalOnProperty(name = "firebase.enabled", havingValue = "true", matchIfMissing = true)
public class ReviewService {
    private final Firestore firestore;

    public ReviewService(Firestore firestore) {
        this.firestore = firestore;
    }

    public ReviewResponse create(FirebaseToken token, String rescueId, CreateReviewRequest request) {
        DocumentReference rescueRef = firestore.collection("rescueRequests").document(rescueId);
        DocumentReference reviewRef = firestore.collection("reviews").document(rescueId);
        try {
            firestore.runTransaction(transaction -> {
                DocumentSnapshot rescue = transaction.get(rescueRef).get();
                DocumentSnapshot existingReview = transaction.get(reviewRef).get();
                if (!rescue.exists()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Rescue not found");
                if (!token.getUid().equals(rescue.getString("passengerId"))) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the passenger can review this rescue");
                }
                if (!"completed".equals(rescue.getString("status"))) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Only completed rescues can be reviewed");
                }
                if (existingReview.exists()) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "This rescue has already been reviewed");
                }
                String bikerId = rescue.getString("bikerId");
                if (bikerId == null) throw new ResponseStatusException(HttpStatus.CONFLICT, "Rescue has no assigned biker");
                DocumentReference bikerRef = firestore.collection("users").document(bikerId);
                DocumentSnapshot biker = transaction.get(bikerRef).get();
                if (!biker.exists()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Biker profile not found");

                Number oldTotal = (Number) biker.get("ratingTotal");
                Number oldCount = (Number) biker.get("ratingCount");
                double ratingTotal = (oldTotal == null ? 0 : oldTotal.doubleValue()) + request.rating();
                long ratingCount = (oldCount == null ? 0 : oldCount.longValue()) + 1;
                Map<String, Object> review = new HashMap<>();
                review.put("rescueId", rescueId);
                review.put("passengerId", token.getUid());
                review.put("passengerName", rescue.getString("passengerName"));
                review.put("passengerProfilePhotoPath", rescue.getString("passengerProfilePhotoPath"));
                review.put("bikerId", bikerId);
                review.put("bikerName", rescue.getString("bikerName"));
                review.put("bikerProfilePhotoPath", rescue.getString("bikerProfilePhotoPath"));
                review.put("rating", request.rating());
                review.put("comment", request.comment() == null ? "" : request.comment().trim());
                review.put("createdAt", Timestamp.now());
                transaction.create(reviewRef, review);
                transaction.update(bikerRef, Map.of(
                        "ratingTotal", ratingTotal,
                        "ratingCount", ratingCount,
                        "rating", ratingTotal / ratingCount
                ));
                return null;
            }).get();
            return from(reviewRef.get().get());
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw unavailable(exception);
        } catch (ExecutionException exception) {
            if (exception.getCause() instanceof ResponseStatusException statusException) throw statusException;
            throw unavailable(exception);
        }
    }

    public List<ReviewResponse> mine(FirebaseToken token) {
        try {
            return firestore.collection("reviews").whereEqualTo("passengerId", token.getUid())
                    .limit(100).get().get().getDocuments().stream()
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

    public List<ReviewResponse> received(FirebaseToken token) {
        try {
            return firestore.collection("reviews").whereEqualTo("bikerId", token.getUid())
                    .limit(100).get().get().getDocuments().stream()
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

    private ReviewResponse from(DocumentSnapshot snapshot) {
        Number rating = (Number) snapshot.get("rating");
        Timestamp createdAt = snapshot.getTimestamp("createdAt");
        String passengerId = snapshot.getString("passengerId");
        String bikerId = snapshot.getString("bikerId");
        String passengerProfilePhotoPath = snapshot.getString("passengerProfilePhotoPath");
        String bikerProfilePhotoPath = snapshot.getString("bikerProfilePhotoPath");
        return new ReviewResponse(snapshot.getId(), snapshot.getString("rescueId"),
                passengerId, snapshot.getString("passengerName"),
                passengerProfilePhotoPath == null ? profilePhotoPath(passengerId) : passengerProfilePhotoPath,
                bikerId, snapshot.getString("bikerName"),
                bikerProfilePhotoPath == null ? profilePhotoPath(bikerId) : bikerProfilePhotoPath,
                rating == null ? 0 : rating.intValue(), snapshot.getString("comment"),
                createdAt == null ? null : createdAt.toDate().toInstant());
    }

    private String profilePhotoPath(String uid) {
        if (uid == null || uid.isBlank()) return null;
        try {
            DocumentSnapshot profile = firestore.collection("users").document(uid).get().get();
            return profile.exists() ? profile.getString("profilePhotoPath") : null;
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
