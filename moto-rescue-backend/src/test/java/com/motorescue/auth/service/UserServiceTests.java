package com.motorescue.auth.service;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import com.google.cloud.Timestamp;

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

    @Test
    void zoneMatchingRequiresRecentLocation() {
        Instant now = Instant.parse("2026-07-15T10:00:00Z");
        assertThat(RescueService.isFreshLocation(Timestamp.ofTimeSecondsAndNanos(now.minusSeconds(30).getEpochSecond(), 0), now)).isTrue();
        assertThat(RescueService.isFreshLocation(Timestamp.ofTimeSecondsAndNanos(now.minusSeconds(121).getEpochSecond(), 0), now)).isFalse();
    }

    @Test
    void onlineContactPhoneMustBeUsable() {
        assertThat(UserService.hasContactPhone("+905551112233")).isTrue();
        assertThat(UserService.hasContactPhone("05551112233")).isTrue();
        assertThat(UserService.hasContactPhone(null)).isFalse();
        assertThat(UserService.hasContactPhone("555 111 22")).isFalse();
        assertThat(UserService.hasContactPhone("123")).isFalse();
    }

}
