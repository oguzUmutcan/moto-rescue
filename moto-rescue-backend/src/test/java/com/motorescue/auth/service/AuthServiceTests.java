package com.motorescue.auth.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AuthServiceTests {

    private final AuthService authService = new AuthService();

    @Test
    void authenticateRejectsMissingBearerHeader() {
        assertThatThrownBy(() -> authService.authenticate(null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Bearer token is required");
    }

    @Test
    void authenticateRejectsNonBearerHeader() {
        assertThatThrownBy(() -> authService.authenticate("Basic abc"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Bearer token is required");
    }
}
