package com.motorescue.auth.dto;

import java.time.Instant;
import java.util.List;

public final class PublicBikerDtos {
    private PublicBikerDtos() {}

    public record PublicBikerSummary(
            String uid,
            String name,
            String profilePhotoPath,
            String bio,
            String motorcycleModel,
            String motorcycleColor,
            double rating,
            long reviewCount,
            long totalRescues
    ) {}

    public record PublicBikerReview(
            String id,
            String passengerName,
            int rating,
            String comment,
            Instant createdAt
    ) {}

    public record PublicRescueHistory(
            String urgency,
            boolean helmetProvided,
            Instant completedAt
    ) {}

    public record PublicBikerProfile(
            PublicBikerSummary biker,
            List<PublicBikerReview> reviews,
            List<PublicRescueHistory> rescueHistory
    ) {}
}
