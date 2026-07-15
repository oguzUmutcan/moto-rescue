package com.motorescue.auth.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public final class RescueDtos {

    private RescueDtos() {}

    public record CreateRescueRequest(
            @DecimalMin("-90.0") @DecimalMax("90.0") double latitude,
            @DecimalMin("-180.0") @DecimalMax("180.0") double longitude,
            @NotBlank @Size(max = 200) String pickupLabel,
            @NotBlank @Size(max = 200) String destinationLabel,
            @DecimalMin("-90.0") @DecimalMax("90.0") double destinationLatitude,
            @DecimalMin("-180.0") @DecimalMax("180.0") double destinationLongitude,
            @NotBlank @Size(max = 50) String urgency,
            boolean needsHelmet
    ) {}

    public record StartRescueRequest(
            @NotBlank @Pattern(regexp = "\\d{6}") String boardingCode
    ) {}

    public record RescueResponse(
            String id,
            String passengerId,
            String passengerName,
            double latitude,
            double longitude,
            String pickupLabel,
            String destinationLabel,
            double destinationLatitude,
            double destinationLongitude,
            String urgency,
            boolean needsHelmet,
            String status,
            String bikerId,
            String bikerName,
            Instant createdAt,
            Instant expiresAt,
            Instant acceptedAt,
            String boardingCode,
            Instant boardingVerifiedAt,
            Instant startedAt,
            Instant completedAt
    ) {}
}
