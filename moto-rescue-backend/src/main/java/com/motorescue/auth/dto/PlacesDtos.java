package com.motorescue.auth.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public final class PlacesDtos {
    private PlacesDtos() {}

    public record AutocompleteRequest(
            @NotBlank @Size(min = 3, max = 200) String input,
            @DecimalMin("-90.0") @DecimalMax("90.0") Double latitude,
            @DecimalMin("-180.0") @DecimalMax("180.0") Double longitude,
            @Size(max = 100) String sessionToken
    ) {}

    public record PlacePrediction(
            String placeId,
            String label,
            String details,
            Long distanceMeters
    ) {}

    public record AutocompleteResponse(List<PlacePrediction> predictions) {}

    public record PlaceDetailsResponse(
            String placeId,
            String label,
            String formattedAddress,
            double latitude,
            double longitude
    ) {}
}
