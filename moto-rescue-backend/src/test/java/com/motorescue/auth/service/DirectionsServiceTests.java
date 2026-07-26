package com.motorescue.auth.service;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class DirectionsServiceTests {

    @Test
    void convertsGoogleDurationToMinutes() {
        assertThat(DirectionsService.durationMinutes("90s")).isEqualTo(1.5);
        assertThat(DirectionsService.durationMinutes("30.5s")).isCloseTo(
                0.508333,
                org.assertj.core.data.Offset.offset(0.000001)
        );
    }

    @Test
    void rejectsMalformedGoogleDuration() {
        assertThatThrownBy(() -> DirectionsService.durationMinutes("unknown"))
                .isInstanceOfSatisfying(
                        ResponseStatusException.class,
                        exception -> assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.BAD_GATEWAY)
                );
    }
}
