package com.motorescue.auth.controller;

import com.google.firebase.auth.FirebaseToken;
import com.motorescue.auth.dto.RescueDtos.CreateRescueRequest;
import com.motorescue.auth.dto.RescueDtos.RescueResponse;
import com.motorescue.auth.service.AuthService;
import com.motorescue.auth.service.RescueService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/rescues")
@ConditionalOnProperty(name = "firebase.enabled", havingValue = "true", matchIfMissing = true)
public class RescueController {

    private final AuthService authService;
    private final RescueService rescueService;

    public RescueController(AuthService authService, RescueService rescueService) {
        this.authService = authService;
        this.rescueService = rescueService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RescueResponse create(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Valid @RequestBody CreateRescueRequest request
    ) {
        return rescueService.create(authService.authenticate(authorization), request);
    }

    @GetMapping("/{requestId}")
    public RescueResponse get(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable String requestId
    ) {
        return rescueService.get(authService.authenticate(authorization), requestId);
    }

    @GetMapping("/open")
    public List<RescueResponse> open(
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        return rescueService.open(authService.authenticate(authorization));
    }

    @GetMapping("/history")
    public List<RescueResponse> history(
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        return rescueService.history(authService.authenticate(authorization));
    }

    @GetMapping("/active")
    public RescueResponse active(
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        return rescueService.active(authService.authenticate(authorization));
    }

    @PostMapping("/{requestId}/accept")
    public RescueResponse accept(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable String requestId
    ) {
        FirebaseToken token = authService.authenticate(authorization);
        return rescueService.accept(token, requestId);
    }

    @PostMapping("/{requestId}/cancel")
    public RescueResponse cancel(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable String requestId
    ) {
        return rescueService.cancel(authService.authenticate(authorization), requestId);
    }

    @PostMapping("/{requestId}/start")
    public RescueResponse start(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable String requestId
    ) {
        return rescueService.start(authService.authenticate(authorization), requestId);
    }

    @PostMapping("/{requestId}/complete")
    public RescueResponse complete(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable String requestId
    ) {
        return rescueService.complete(authService.authenticate(authorization), requestId);
    }
}
