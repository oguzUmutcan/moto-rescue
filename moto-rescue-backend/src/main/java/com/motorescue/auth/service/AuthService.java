package com.motorescue.auth.service;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

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

    public FirebaseToken verifyPhoneIdentity(String idToken) {
        FirebaseToken token = verifyIdToken(idToken);
        String phoneNumber = token.getClaims().get("phone_number") instanceof String value
                ? value
                : null;

        if (phoneNumber == null || phoneNumber.isBlank()) {
            throw new IllegalArgumentException("The authenticated Firebase user has no verified phone number");
        }

        return token;
    }
}
