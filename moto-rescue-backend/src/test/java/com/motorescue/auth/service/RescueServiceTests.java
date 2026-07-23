package com.motorescue.auth.service;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class RescueServiceTests {

    @Test
    void onlyFreshSearchingRequestsCanBeAccepted() {
        assertThatCode(() -> RescueService.validateAcceptable("searching", false))
                .doesNotThrowAnyException();
        assertStatus(() -> RescueService.validateAcceptable("accepted", false), HttpStatus.CONFLICT);
        assertStatus(() -> RescueService.validateAcceptable("searching", true), HttpStatus.CONFLICT);
    }

    @Test
    void passengerCanCancelOnlyBeforeRideStarts() {
        assertThatCode(() -> RescueService.validateCancellation("p1", "p1", "searching"))
                .doesNotThrowAnyException();
        assertThatCode(() -> RescueService.validateCancellation("p1", "p1", "accepted"))
                .doesNotThrowAnyException();
        assertStatus(
                () -> RescueService.validateCancellation("other", "p1", "searching"),
                HttpStatus.FORBIDDEN
        );
        assertStatus(
                () -> RescueService.validateCancellation("p1", "p1", "in_progress"),
                HttpStatus.CONFLICT
        );
    }

    @Test
    void assignedBikerNeedsAcceptedStatusAndCorrectBoardingCodeToStart() {
        assertThatCode(() -> RescueService.validateStart("b1", "b1", "accepted", "123456", "123456"))
                .doesNotThrowAnyException();
        assertStatus(
                () -> RescueService.validateStart("other", "b1", "accepted", "123456", "123456"),
                HttpStatus.FORBIDDEN
        );
        assertStatus(
                () -> RescueService.validateStart("b1", "b1", "in_progress", "123456", "123456"),
                HttpStatus.CONFLICT
        );
        assertStatus(
                () -> RescueService.validateStart("b1", "b1", "accepted", "000000", "123456"),
                HttpStatus.BAD_REQUEST
        );
    }

    @Test
    void onlyAssignedBikerCanCompleteAnInProgressRide() {
        assertThatCode(() -> RescueService.validateBikerTransition("b1", "b1", "in_progress", "in_progress"))
                .doesNotThrowAnyException();
        assertStatus(
                () -> RescueService.validateBikerTransition("other", "b1", "in_progress", "in_progress"),
                HttpStatus.FORBIDDEN
        );
        assertStatus(
                () -> RescueService.validateBikerTransition("b1", "b1", "completed", "in_progress"),
                HttpStatus.CONFLICT
        );
    }

    private void assertStatus(Runnable action, HttpStatus expectedStatus) {
        assertThatThrownBy(action::run)
                .isInstanceOfSatisfying(
                        ResponseStatusException.class,
                        exception -> org.assertj.core.api.Assertions.assertThat(exception.getStatusCode())
                                .isEqualTo(expectedStatus)
                );
    }
}
