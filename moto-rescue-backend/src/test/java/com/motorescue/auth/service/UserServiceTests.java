package com.motorescue.auth.service;

import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

class UserServiceTests {

    @Test
    void onlineEligibilityRequiresBothSubmittedDocumentSides() {
        assertThat(UserService.hasSubmittedIdentityDocument("pending", "identity/front", "identity/back")).isFalse();
        assertThat(UserService.hasSubmittedIdentityDocument("verified", "identity/front", "identity/back")).isTrue();
        assertThat(UserService.hasSubmittedIdentityDocument("not_submitted", null, null)).isFalse();
        assertThat(UserService.hasSubmittedIdentityDocument("rejected", "identity/front", "identity/back")).isFalse();
        assertThat(UserService.hasSubmittedIdentityDocument("pending", "identity/front", null)).isFalse();
    }

    @Test
    void pendingDocumentBecomesDueAfterOneMinute() {
        Instant submittedAt = Instant.parse("2026-07-15T09:00:00Z");

        assertThat(UserService.isAutoVerificationDue("pending", submittedAt, submittedAt.plusSeconds(59))).isFalse();
        assertThat(UserService.isAutoVerificationDue("pending", submittedAt, submittedAt.plusSeconds(60))).isTrue();
        assertThat(UserService.isAutoVerificationDue("verified", submittedAt, submittedAt.plusSeconds(120))).isFalse();
    }
}
