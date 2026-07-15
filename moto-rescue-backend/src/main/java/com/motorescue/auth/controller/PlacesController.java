package com.motorescue.auth.controller;

import com.motorescue.auth.dto.PlacesDtos.AutocompleteRequest;
import com.motorescue.auth.dto.PlacesDtos.AutocompleteResponse;
import com.motorescue.auth.dto.PlacesDtos.PlaceDetailsResponse;
import com.motorescue.auth.service.AuthService;
import com.motorescue.auth.service.PlacesService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@RequestMapping("/api/places")
public class PlacesController {
    private final AuthService authService;
    private final PlacesService placesService;

    public PlacesController(AuthService authService, PlacesService placesService) {
        this.authService = authService;
        this.placesService = placesService;
    }

    @PostMapping("/autocomplete")
    public AutocompleteResponse autocomplete(@RequestHeader("Authorization") String authorization,
                                             @Valid @RequestBody AutocompleteRequest request) {
        authService.authenticate(authorization);
        return placesService.autocomplete(request);
    }

    @GetMapping("/{placeId}")
    public PlaceDetailsResponse details(@RequestHeader("Authorization") String authorization,
                                        @PathVariable @NotBlank @Size(max = 200) String placeId,
                                        @RequestParam(required = false) @Size(max = 100) String sessionToken) {
        authService.authenticate(authorization);
        return placesService.details(placeId, sessionToken);
    }
}
