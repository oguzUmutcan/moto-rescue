package com.motorescue.auth.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PublicBikerServiceTests {

    @Test
    void publicReviewerNamesAreAnonymized() {
        assertThat(PublicBikerService.anonymizedPassengerName("Alice Smith")).isEqualTo("A***");
        assertThat(PublicBikerService.anonymizedPassengerName(" B ")).isEqualTo("B");
        assertThat(PublicBikerService.anonymizedPassengerName(null)).isEqualTo("Passenger");
    }
}
