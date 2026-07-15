package com.motorescue.auth.service;

import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.FieldValue;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.google.firebase.auth.UserRecord;
import com.motorescue.auth.dto.UserDtos.CreateProfileRequest;
import com.motorescue.auth.dto.UserDtos.UpdateProfileRequest;
import com.motorescue.auth.dto.UserDtos.UserProfileResponse;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@Service
@ConditionalOnProperty(name = "firebase.enabled", havingValue = "true", matchIfMissing = true)
public class UserService {
    private final Firestore firestore;

    public UserService(Firestore firestore) {
        this.firestore = firestore;
    }

    public UserProfileResponse create(FirebaseToken token, CreateProfileRequest request) {
        Map<String, Object> data = new HashMap<>();
        data.put("name", request.name().trim());
        data.put("email", token.getEmail());
        data.put("phone", request.phone().trim());
        data.put("phoneVerified", token.getClaims().containsKey("phone_number"));
        data.put("role", null);
        data.put("online", false);
        data.put("notificationsEnabled", true);
        data.put("identityDocumentStatus", "not_submitted");
        data.put("rating", 5.0);
        data.put("totalRescues", 0L);
        data.put("createdAt", Timestamp.now());
        await(firestore.collection("users").document(token.getUid()).set(data));
        updateAuthDisplayName(token.getUid(), request.name().trim());
        return get(token);
    }

    public UserProfileResponse get(FirebaseToken token) {
        return from(profile(token.getUid()), token.getUid());
    }

    public UserProfileResponse setRole(FirebaseToken token, String role) {
        if (!"passenger".equals(role) && !"biker".equals(role)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid role");
        }
        await(firestore.collection("users").document(token.getUid()).update("role", role));
        return get(token);
    }

    public UserProfileResponse update(FirebaseToken token, UpdateProfileRequest request) {
        Map<String, Object> updates = new HashMap<>();
        put(updates, "name", request.name());
        put(updates, "emergencyContact", request.emergencyContact());
        put(updates, "profileEmoji", request.profileEmoji());
        put(updates, "bio", request.bio());
        put(updates, "plateNumber", request.plateNumber());
        put(updates, "motorcycleModel", request.motorcycleModel());
        put(updates, "motorcycleColor", request.motorcycleColor());
        if (request.availableDays() != null) {
            if (request.availableDays().size() != 7) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "availableDays must contain 7 values");
            }
            updates.put("availableDays", request.availableDays());
        }
        if (request.online() != null) updates.put("online", request.online());
        if (request.notificationsEnabled() != null) updates.put("notificationsEnabled", request.notificationsEnabled());
        if (updates.isEmpty()) return get(token);
        await(firestore.collection("users").document(token.getUid()).update(updates));
        if (request.name() != null && !request.name().isBlank()) updateAuthDisplayName(token.getUid(), request.name().trim());
        return get(token);
    }

    public UserProfileResponse setProfilePhoto(FirebaseToken token, String storagePath) {
        String expectedPath = "profilePhotos/" + token.getUid() + "/avatar";
        if (!expectedPath.equals(storagePath)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid profile photo path");
        }
        await(firestore.collection("users").document(token.getUid()).update("profilePhotoPath", expectedPath));
        return get(token);
    }

    public void clearProfilePhoto(FirebaseToken token) {
        await(firestore.collection("users").document(token.getUid()).update(
                "profilePhotoPath", FieldValue.delete()
        ));
    }

    public void delete(FirebaseToken token) {
        await(firestore.collection("users").document(token.getUid()).delete());
        try {
            FirebaseAuth.getInstance().deleteUser(token.getUid());
        } catch (FirebaseAuthException exception) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Authentication account deletion failed", exception);
        }
    }

    private DocumentSnapshot profile(String uid) {
        try {
            DocumentSnapshot snapshot = firestore.collection("users").document(uid).get().get();
            if (!snapshot.exists()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User profile not found");
            return snapshot;
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw unavailable(exception);
        } catch (ExecutionException exception) {
            throw unavailable(exception);
        }
    }

    @SuppressWarnings("unchecked")
    private UserProfileResponse from(DocumentSnapshot value, String uid) {
        Timestamp createdAt = value.getTimestamp("createdAt");
        Number rating = (Number) value.get("rating");
        Number total = (Number) value.get("totalRescues");
        return new UserProfileResponse(
                uid, value.getString("name"), value.getString("email"), value.getString("phone"),
                Boolean.TRUE.equals(value.getBoolean("phoneVerified")), value.getString("role"),
                value.getString("emergencyContact"), value.getString("profileEmoji"), value.getString("bio"),
                value.getString("profilePhotoPath"),
                value.getString("plateNumber"), value.getString("motorcycleModel"), value.getString("motorcycleColor"),
                (List<Boolean>) value.get("availableDays"), Boolean.TRUE.equals(value.getBoolean("online")),
                !Boolean.FALSE.equals(value.getBoolean("notificationsEnabled")), value.getString("identityDocumentStatus"),
                rating == null ? 5.0 : rating.doubleValue(), total == null ? 0 : total.longValue(),
                createdAt == null ? null : createdAt.toDate().toInstant()
        );
    }

    private void put(Map<String, Object> updates, String field, String value) {
        if (value != null) updates.put(field, value.trim());
    }

    private void updateAuthDisplayName(String uid, String name) {
        try {
            FirebaseAuth.getInstance().updateUser(new UserRecord.UpdateRequest(uid).setDisplayName(name));
        } catch (FirebaseAuthException exception) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Authentication profile update failed", exception);
        }
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
