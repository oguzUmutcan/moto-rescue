package com.motorescue.auth.service;

import com.motorescue.auth.dto.DirectionsDtos.RouteRequest;
import com.motorescue.auth.dto.DirectionsDtos.RouteResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.JsonNode;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;

@Service
public class DirectionsService {
    private static final String ROUTE_FIELDS =
            "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline";

    private final RestClient restClient;
    private final String apiKey;

    public DirectionsService(@Value("${google.directions.api-key:}") String apiKey) {
        this.restClient = RestClient.builder()
                .baseUrl("https://routes.googleapis.com")
                .build();
        this.apiKey = apiKey;
    }

    public RouteResponse route(RouteRequest request) {
        requireConfigured();
        Map<String, Object> body = Map.of(
                "origin", waypoint(request.originLatitude(), request.originLongitude()),
                "destination", waypoint(request.destinationLatitude(), request.destinationLongitude()),
                "travelMode", "DRIVE",
                "routingPreference", "TRAFFIC_AWARE"
        );

        try {
            JsonNode response = restClient.post()
                    .uri("/directions/v2:computeRoutes")
                    .header("X-Goog-Api-Key", apiKey)
                    .header("X-Goog-FieldMask", ROUTE_FIELDS)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);
            JsonNode route = response == null ? null : response.path("routes").path(0);
            if (route == null || route.isMissingNode()) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Google Routes returned no route");
            }
            String encodedPolyline = route.path("polyline").path("encodedPolyline").stringValue("");
            if (encodedPolyline.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Google Routes returned no polyline");
            }
            return new RouteResponse(
                    encodedPolyline,
                    route.path("distanceMeters").asDouble() / 1_000.0,
                    durationMinutes(route.path("duration").stringValue(""))
            );
        } catch (RestClientException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Google Routes request failed", exception);
        }
    }

    static double durationMinutes(String value) {
        if (value == null || !value.endsWith("s")) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Google Routes returned an invalid duration");
        }
        try {
            BigDecimal seconds = new BigDecimal(value.substring(0, value.length() - 1));
            return seconds.divide(BigDecimal.valueOf(60), 6, RoundingMode.HALF_UP).doubleValue();
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Google Routes returned an invalid duration",
                    exception
            );
        }
    }

    private Map<String, Object> waypoint(double latitude, double longitude) {
        return Map.of(
                "location", Map.of(
                        "latLng", Map.of(
                                "latitude", latitude,
                                "longitude", longitude
                        )
                )
        );
    }

    private void requireConfigured() {
        if (apiKey == null || apiKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Google Routes is not configured");
        }
    }
}
