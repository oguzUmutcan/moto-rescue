package com.motorescue.auth.service;

import com.google.cloud.Timestamp;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

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

    @Test
    void onlineScheduleForbidsGoingOnlineWhenDayIsDisabled() {
        // 2026-11-16 is Monday (dayIndex = 0 in Europe/Istanbul)
        Instant monday = Instant.parse("2026-11-16T10:00:00Z");
        List<Boolean> schedule = List.of(false, true, true, true, true, true, true);

        assertThatThrownBy(() -> UserService.validateOnlineSchedule(schedule, monday))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
                    assertThat(rse.getReason()).isEqualTo(
                            "You are not scheduled to be online today. Please update your available days in your profile."
                    );
                });
    }

    @Test
    void onlineScheduleAllowsGoingOnlineWhenDayIsEnabled() {
        // 2026-11-16 is Monday (dayIndex = 0 in Europe/Istanbul)
        Instant monday = Instant.parse("2026-11-16T10:00:00Z");
        List<Boolean> schedule = List.of(true, false, false, false, false, false, false);

        assertThatCode(() -> UserService.validateOnlineSchedule(schedule, monday))
                .doesNotThrowAnyException();
    }

    @Test
    void onlineScheduleAllowsGoingOnlineWhenAvailableDaysIsNull() {
        Instant monday = Instant.parse("2026-11-16T10:00:00Z");

        assertThatCode(() -> UserService.validateOnlineSchedule(null, monday))
                .doesNotThrowAnyException();
    }

    @Test
    void onlineScheduleAllowsGoingOnlineWhenAvailableDaysHasInvalidSize() {
        Instant monday = Instant.parse("2026-11-16T10:00:00Z");

        assertThatCode(() -> UserService.validateOnlineSchedule(List.of(true, false), monday))
                .doesNotThrowAnyException();
    }

    @Test
    void onlineScheduleEvaluatesUsingCurrentTime() {
        int todayIndex = Instant.now().atZone(ZoneId.of("Europe/Istanbul")).getDayOfWeek().getValue() - 1;

        List<Boolean> disabledToday = new ArrayList<>(Collections.nCopies(7, true));
        disabledToday.set(todayIndex, false);
        assertThatThrownBy(() -> UserService.validateOnlineSchedule(disabledToday))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN));

        List<Boolean> enabledToday = new ArrayList<>(Collections.nCopies(7, false));
        enabledToday.set(todayIndex, true);
        assertThatCode(() -> UserService.validateOnlineSchedule(enabledToday))
                .doesNotThrowAnyException();
    }

}
