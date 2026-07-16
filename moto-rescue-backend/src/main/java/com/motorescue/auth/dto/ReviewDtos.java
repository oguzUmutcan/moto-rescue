package com.motorescue.auth.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public final class ReviewDtos {
    private ReviewDtos() {}

    public record CreateReviewRequest(
            @Min(1) @Max(5) int rating,
            @Size(max = 500) String comment
    ) {}

    public record ReviewResponse(
            String id, String rescueId, String passengerId, String passengerName,
            String passengerProfilePhotoPath, String bikerId, String bikerName,
            String bikerProfilePhotoPath, int rating, String comment, Instant createdAt
    ) {}
}
