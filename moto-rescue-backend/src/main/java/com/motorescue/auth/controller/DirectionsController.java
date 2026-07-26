package com.motorescue.auth.controller;

import com.motorescue.auth.dto.DirectionsDtos.RouteRequest;
import com.motorescue.auth.dto.DirectionsDtos.RouteResponse;
import com.motorescue.auth.service.AuthService;
import com.motorescue.auth.service.DirectionsService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/directions")
public class DirectionsController {
    private final AuthService authService;
    private final DirectionsService directionsService;

    public DirectionsController(AuthService authService, DirectionsService directionsService) {
        this.authService = authService;
        this.directionsService = directionsService;
    }

    @PostMapping
    public RouteResponse route(@RequestHeader("Authorization") String authorization,
                               @Valid @RequestBody RouteRequest request) {
        authService.authenticate(authorization);
        return directionsService.route(request);
    }
}
