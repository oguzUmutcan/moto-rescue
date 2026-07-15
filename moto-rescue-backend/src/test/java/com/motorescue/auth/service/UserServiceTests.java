package com.motorescue.auth.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class UserServiceTests {

    @Test
    void onlineEligibilityRequiresBothSubmittedDocumentSides() {
        assertThat(UserService.hasSubmittedIdentityDocument("pending", "identity/front", "identity/back")).isTrue();
        assertThat(UserService.hasSubmittedIdentityDocument("verified", "identity/front", "identity/back")).isTrue();
        assertThat(UserService.hasSubmittedIdentityDocument("not_submitted", null, null)).isFalse();
        assertThat(UserService.hasSubmittedIdentityDocument("rejected", "identity/front", "identity/back")).isFalse();
        assertThat(UserService.hasSubmittedIdentityDocument("pending", "identity/front", null)).isFalse();
    }
}
