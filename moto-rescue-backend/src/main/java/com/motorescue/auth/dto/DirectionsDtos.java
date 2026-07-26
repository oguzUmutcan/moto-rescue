package com.motorescue.auth.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;

public final class DirectionsDtos {
    private DirectionsDtos() {}

    public record RouteRequest(
            @DecimalMin("-90.0") @DecimalMax("90.0") double originLatitude,
            @DecimalMin("-180.0") @DecimalMax("180.0") double originLongitude,
            @DecimalMin("-90.0") @DecimalMax("90.0") double destinationLatitude,
            @DecimalMin("-180.0") @DecimalMax("180.0") double destinationLongitude
    ) {}

    public record RouteResponse(
            String encodedPolyline,
            double distanceKm,
            double durationMinutes
    ) {}
}
