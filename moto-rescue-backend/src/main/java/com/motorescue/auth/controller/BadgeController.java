package com.motorescue.auth.controller;

import com.motorescue.auth.dto.BadgeDtos.BadgeSummaryResponse;
import com.motorescue.auth.service.AuthService;
import com.motorescue.auth.service.BadgeService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/badges")
@ConditionalOnProperty(name = "firebase.enabled", havingValue = "true", matchIfMissing = true)
public class BadgeController {
    private final AuthService authService;
    private final BadgeService badgeService;

    public BadgeController(AuthService authService, BadgeService badgeService) {
        this.authService = authService;
        this.badgeService = badgeService;
    }

    @GetMapping("/me")
    public BadgeSummaryResponse mine(@RequestHeader("Authorization") String authorization) {
        return badgeService.mine(authService.authenticate(authorization));
    }
}
