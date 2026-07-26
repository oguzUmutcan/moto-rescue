package com.motorescue.auth.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ReviewServiceTests {

    @Test
    void replacesLegacyUserSnapshotsWithTheProfileName() {
        assertThat(ReviewService.preferredReviewName("User", "Alice Passenger", "Passenger"))
                .isEqualTo("Alice Passenger");
        assertThat(ReviewService.preferredReviewName(null, "Bora Biker", "Biker"))
                .isEqualTo("Bora Biker");
    }

    @Test
    void keepsSpecificSnapshotNamesAndHasARoleFallback() {
        assertThat(ReviewService.preferredReviewName("Old Name", "New Name", "Passenger"))
                .isEqualTo("Old Name");
        assertThat(ReviewService.preferredReviewName("User", " ", "Passenger"))
                .isEqualTo("Passenger");
    }
}
