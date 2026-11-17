package com.motorescue.auth.service;

import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.FieldValue;
import com.google.cloud.firestore.GeoPoint;
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
import java.time.ZoneId;
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
        data.put("language", request.language() == null ? "en" : request.language());
        data.put("phoneVerified", false);
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
        DocumentSnapshot current = profile(token.getUid());
        Timestamp submittedAt = current.getTimestamp("identityDocumentSubmittedAt");
        if (isAutoVerificationDue(
                current.getString("identityDocumentStatus"),
                submittedAt == null ? null : submittedAt.toDate().toInstant(),
                Instant.now()
        )) {
            await(firestore.collection("users").document(token.getUid()).update("identityDocumentStatus", "verified"));
            current = profile(token.getUid());
        }
        return from(current, token.getUid());
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
        put(updates, "phone", request.phone());
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
        if (Boolean.TRUE.equals(request.online())) {
            DocumentSnapshot current = profile(token.getUid());
            if (!"biker".equals(current.getString("role"))) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "The biker role is required to go online");
            }
            String contactPhone = current.getString("phone");
            if (!hasContactPhone(contactPhone)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Add a valid contact phone number before going online");
            }
            if (!hasSubmittedIdentityDocument(
                    current.getString("identityDocumentStatus"),
                    current.getString("identityDocumentFrontPath"),
                    current.getString("identityDocumentBackPath")
            )) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Submit both sides of your driver's license before going online");
            }
            @SuppressWarnings("unchecked")
            List<Boolean> effectiveAvailableDays = request.availableDays() != null
                    ? request.availableDays()
                    : (List<Boolean>) current.get("availableDays");
            validateOnlineSchedule(effectiveAvailableDays, Instant.now());
        }
        if (request.online() != null) updates.put("online", request.online());
        if (request.notificationsEnabled() != null) updates.put("notificationsEnabled", request.notificationsEnabled());
        if (request.language() != null) updates.put("language", request.language());
        if (updates.isEmpty()) return get(token);
        await(firestore.collection("users").document(token.getUid()).update(updates));
        if (request.name() != null && !request.name().isBlank()) updateAuthDisplayName(token.getUid(), request.name().trim());
        return get(token);
    }

    static boolean hasContactPhone(String phone) {
        return phone != null && phone.matches("^\\+?[0-9]{7,15}$");
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

    public void updateLocation(FirebaseToken token, double latitude, double longitude) {
        await(firestore.collection("users").document(token.getUid()).update(Map.of(
                "currentLocation", new GeoPoint(latitude, longitude),
                "locationUpdatedAt", Timestamp.now()
        )));
    }

    public UserProfileResponse setPushToken(FirebaseToken token, String expoPushToken) {
        if (!expoPushToken.startsWith("ExponentPushToken[") && !expoPushToken.startsWith("ExpoPushToken[")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid Expo push token");
        }
        await(firestore.collection("users").document(token.getUid()).update(Map.of(
                "expoPushToken", expoPushToken.trim(),
                "pushTokenUpdatedAt", Timestamp.now()
        )));
        return get(token);
    }

    public void clearPushToken(FirebaseToken token) {
        await(firestore.collection("users").document(token.getUid()).update(Map.of(
                "expoPushToken", FieldValue.delete(),
                "pushTokenUpdatedAt", Timestamp.now()
        )));
    }

    public UserProfileResponse submitIdentityDocument(FirebaseToken token, String frontPath, String backPath) {
        DocumentSnapshot current = profile(token.getUid());
        if (!"biker".equals(current.getString("role"))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "The biker role is required");
        }
        String prefix = "identityDocuments/" + token.getUid() + "/";
        if (!(prefix + "front").equals(frontPath) || !(prefix + "back").equals(backPath)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid identity document paths");
        }
        if ("verified".equals(current.getString("identityDocumentStatus"))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Verified documents cannot be replaced");
        }
        await(firestore.collection("users").document(token.getUid()).update(Map.of(
                "identityDocumentFrontPath", frontPath,
                "identityDocumentBackPath", backPath,
                "identityDocumentStatus", "pending",
                "identityDocumentSubmittedAt", Timestamp.now(),
                "online", false
        )));
        return get(token);
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
        Timestamp documentSubmittedAt = value.getTimestamp("identityDocumentSubmittedAt");
        return new UserProfileResponse(
                uid, value.getString("name"), value.getString("email"), value.getString("phone"),
                Boolean.TRUE.equals(value.getBoolean("phoneVerified")), value.getString("language"), value.getString("role"),
                value.getString("emergencyContact"), value.getString("profileEmoji"), value.getString("bio"),
                value.getString("profilePhotoPath"),
                value.getString("plateNumber"), value.getString("motorcycleModel"), value.getString("motorcycleColor"),
                (List<Boolean>) value.get("availableDays"), Boolean.TRUE.equals(value.getBoolean("online")),
                !Boolean.FALSE.equals(value.getBoolean("notificationsEnabled")), value.getString("identityDocumentStatus"),
                value.getString("identityDocumentFrontPath"), value.getString("identityDocumentBackPath"),
                documentSubmittedAt == null ? null : documentSubmittedAt.toDate().toInstant(),
                rating == null ? 5.0 : rating.doubleValue(), total == null ? 0 : total.longValue(),
                createdAt == null ? null : createdAt.toDate().toInstant()
        );
    }

    private void put(Map<String, Object> updates, String field, String value) {
        if (value != null) updates.put(field, value.trim());
    }

    static boolean hasSubmittedIdentityDocument(String status, String frontPath, String backPath) {
        return "verified".equals(status)
                && frontPath != null && !frontPath.isBlank()
                && backPath != null && !backPath.isBlank();
    }

    static void validateOnlineSchedule(List<Boolean> availableDays) {
        validateOnlineSchedule(availableDays, Instant.now());
    }

    static void validateOnlineSchedule(List<Boolean> availableDays, Instant now) {
        if (availableDays != null && availableDays.size() == 7) {
            java.time.DayOfWeek dayOfWeek = now.atZone(ZoneId.of("Europe/Istanbul")).getDayOfWeek();
            int dayIndex = dayOfWeek.getValue() - 1;
            if (!Boolean.TRUE.equals(availableDays.get(dayIndex))) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "You are not scheduled to be online today. Please update your available days in your profile."
                );
            }
        }
    }

    static boolean isAutoVerificationDue(String status, Instant submittedAt, Instant now) {
        return "pending".equals(status)
                && submittedAt != null
                && !submittedAt.plusSeconds(60).isAfter(now);
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
