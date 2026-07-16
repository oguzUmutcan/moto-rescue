package com.motorescue.auth.service;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    public FirebaseToken authenticate(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new IllegalArgumentException("Bearer token is required");
        }
        return verifyIdToken(authorization.substring("Bearer ".length()).trim());
    }

    public FirebaseToken verifyIdToken(String idToken) {
        if (idToken == null || idToken.isBlank()) {
            throw new IllegalArgumentException("A Firebase ID token is required");
        }

        try {
            return FirebaseAuth.getInstance().verifyIdToken(idToken, true);
        } catch (FirebaseAuthException exception) {
            throw new IllegalArgumentException("Invalid or revoked Firebase ID token", exception);
        }
    }
}
