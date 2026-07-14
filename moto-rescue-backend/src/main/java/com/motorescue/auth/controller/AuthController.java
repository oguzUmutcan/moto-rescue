package com.motorescue.auth.controller;

import com.google.firebase.auth.FirebaseToken;
import com.motorescue.auth.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping("/session")
    public Map<String, Object> session(
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        FirebaseToken token = authService.verifyIdToken(extractBearerToken(authorization));
        return Map.of(
                "uid", token.getUid(),
                "emailVerified", token.isEmailVerified(),
                "phoneVerified", token.getClaims().containsKey("phone_number")
        );
    }

    @GetMapping("/phone-session")
    public Map<String, Object> phoneSession(
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        FirebaseToken token = authService.verifyPhoneIdentity(extractBearerToken(authorization));
        return Map.of("uid", token.getUid(), "phoneVerified", true);
    }

    private String extractBearerToken(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Bearer token is required");
        }
        return authorization.substring("Bearer ".length()).trim();
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> invalidToken(IllegalArgumentException exception) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", exception.getMessage()));
    }
}
