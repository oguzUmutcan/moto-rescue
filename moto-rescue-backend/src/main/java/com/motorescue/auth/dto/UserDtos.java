package com.motorescue.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;

import java.time.Instant;
import java.util.List;

public final class UserDtos {
    private UserDtos() {}

    public record CreateProfileRequest(
            @NotBlank @Size(max = 100) String name,
            @NotBlank @Pattern(regexp = "^\\+?[0-9]{7,15}$", message = "phone must contain 7 to 15 digits") String phone,
            @Pattern(regexp = "en|tr") String language
    ) {}

    public record RoleRequest(@Pattern(regexp = "passenger|biker") String role) {}

    public record ProfilePhotoRequest(
            @NotBlank @Size(max = 200) String storagePath
    ) {}

    public record IdentityDocumentRequest(
            @NotBlank @Size(max = 200) String frontStoragePath,
            @NotBlank @Size(max = 200) String backStoragePath
    ) {}

    public record LocationRequest(
            @DecimalMin("-90") @DecimalMax("90") double latitude,
            @DecimalMin("-180") @DecimalMax("180") double longitude
    ) {}

    public record UpdateProfileRequest(
            @Size(max = 100) String name,
            @Pattern(regexp = "^\\+?[0-9]{7,15}$", message = "phone must contain 7 to 15 digits") String phone,
            @Size(max = 30) String emergencyContact,
            @Size(max = 10) String profileEmoji,
            @Size(max = 500) String bio,
            @Size(max = 50) String plateNumber,
            @Size(max = 100) String motorcycleModel,
            @Size(max = 50) String motorcycleColor,
            List<Boolean> availableDays,
            Boolean online,
            Boolean notificationsEnabled,
            @Pattern(regexp = "en|tr") String language
    ) {}

    public record PushTokenRequest(
            @NotBlank @Size(max = 200) String expoPushToken
    ) {}

    public record UserProfileResponse(
            String uid, String name, String email, String phone, boolean phoneVerified, String language,
            String role, String emergencyContact, String profileEmoji, String bio,
            String profilePhotoPath,
            String plateNumber, String motorcycleModel, String motorcycleColor,
            List<Boolean> availableDays, boolean online, boolean notificationsEnabled,
            String identityDocumentStatus, String identityDocumentFrontPath,
            String identityDocumentBackPath, Instant identityDocumentSubmittedAt,
            double rating, long totalRescues,
            Instant createdAt
    ) {}
}
