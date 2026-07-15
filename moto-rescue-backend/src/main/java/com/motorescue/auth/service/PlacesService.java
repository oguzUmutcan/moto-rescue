package com.motorescue.auth.service;

import tools.jackson.databind.JsonNode;
import com.motorescue.auth.dto.PlacesDtos.AutocompleteRequest;
import com.motorescue.auth.dto.PlacesDtos.AutocompleteResponse;
import com.motorescue.auth.dto.PlacesDtos.PlaceDetailsResponse;
import com.motorescue.auth.dto.PlacesDtos.PlacePrediction;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class PlacesService {
    private static final String AUTOCOMPLETE_FIELDS = "suggestions.placePrediction.placeId,suggestions.placePrediction.text.text,suggestions.placePrediction.structuredFormat.mainText.text,suggestions.placePrediction.structuredFormat.secondaryText.text,suggestions.placePrediction.distanceMeters";
    private static final String DETAILS_FIELDS = "id,displayName,formattedAddress,location";

    private final RestClient restClient;
    private final String apiKey;

    public PlacesService(@Value("${google.places.api-key:}") String apiKey) {
        this.restClient = RestClient.builder().baseUrl("https://places.googleapis.com/v1").build();
        this.apiKey = apiKey;
    }

    public AutocompleteResponse autocomplete(AutocompleteRequest request) {
        requireConfigured();
        Map<String, Object> body = new HashMap<>();
        body.put("input", request.input().trim());
        body.put("languageCode", "tr");
        body.put("regionCode", "tr");
        if (request.sessionToken() != null && !request.sessionToken().isBlank()) {
            body.put("sessionToken", request.sessionToken());
        }
        if (request.latitude() != null && request.longitude() != null) {
            Map<String, Object> origin = Map.of("latitude", request.latitude(), "longitude", request.longitude());
            body.put("origin", origin);
            body.put("locationBias", Map.of("circle", Map.of("center", origin, "radius", 50_000.0)));
        }

        try {
            JsonNode response = restClient.post()
                    .uri("/places:autocomplete")
                    .header("X-Goog-Api-Key", apiKey)
                    .header("X-Goog-FieldMask", AUTOCOMPLETE_FIELDS)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);
            List<PlacePrediction> predictions = new ArrayList<>();
            if (response != null) {
                for (JsonNode suggestion : response.path("suggestions")) {
                    JsonNode place = suggestion.path("placePrediction");
                    if (place.isMissingNode() || place.path("placeId").asText().isBlank()) continue;
                    String fullText = place.path("text").path("text").asText();
                    String label = place.path("structuredFormat").path("mainText").path("text").asText(fullText);
                    String details = place.path("structuredFormat").path("secondaryText").path("text").asText();
                    Long distance = place.has("distanceMeters") ? place.path("distanceMeters").asLong() : null;
                    predictions.add(new PlacePrediction(place.path("placeId").asText(), label, details, distance));
                }
            }
            return new AutocompleteResponse(predictions);
        } catch (RestClientResponseException exception) {
            throw upstream(exception);
        }
    }

    public PlaceDetailsResponse details(String placeId, String sessionToken) {
        requireConfigured();
        try {
            JsonNode response = restClient.get()
                    .uri(builder -> builder.path("/places/{placeId}")
                            .queryParam("languageCode", "tr")
                            .queryParamIfPresent("sessionToken", sessionToken == null || sessionToken.isBlank()
                                    ? java.util.Optional.empty() : java.util.Optional.of(sessionToken))
                            .build(placeId))
                    .header("X-Goog-Api-Key", apiKey)
                    .header("X-Goog-FieldMask", DETAILS_FIELDS)
                    .retrieve()
                    .body(JsonNode.class);
            if (response == null || response.path("location").isMissingNode()) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Place details did not include a location");
            }
            return new PlaceDetailsResponse(
                    response.path("id").asText(placeId),
                    response.path("displayName").path("text").asText(),
                    response.path("formattedAddress").asText(),
                    response.path("location").path("latitude").asDouble(),
                    response.path("location").path("longitude").asDouble()
            );
        } catch (RestClientResponseException exception) {
            throw upstream(exception);
        }
    }

    private void requireConfigured() {
        if (apiKey == null || apiKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Google Places is not configured");
        }
    }

    private ResponseStatusException upstream(RestClientResponseException exception) {
        return new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Google Places request failed", exception);
    }
}
