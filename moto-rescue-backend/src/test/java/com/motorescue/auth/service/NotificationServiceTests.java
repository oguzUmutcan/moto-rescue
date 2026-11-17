package com.motorescue.auth.service;

import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.GeoPoint;
import com.motorescue.auth.service.NotificationService.PushResult;
import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collections;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import org.junit.jupiter.api.Test;

import java.util.Map;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class NotificationServiceTests {

    @Test
    void parsesSuccessfulPushTicket() throws Exception {
        PushResult result = NotificationService.parsePushTicket("""
                {"data":[{"status":"ok","id":"ticket-123"}]}
                """);

        assertThat(result.ticketId()).isEqualTo("ticket-123");
        assertThat(result.error()).isNull();
    }

    @Test
    void parsesDeviceNotRegisteredTicket() throws Exception {
        PushResult result = NotificationService.parsePushTicket("""
                {"data":[{"status":"error","message":"Device is not registered",
                "details":{"error":"DeviceNotRegistered"}}]}
                """);

        assertThat(result.ticketId()).isNull();
        assertThat(result.message()).isEqualTo("Device is not registered");
        assertThat(result.error()).isEqualTo("DeviceNotRegistered");
    }

    @Test
    void parsesBatchTicketsInRecipientOrder() throws Exception {
        List<PushResult> results = NotificationService.parsePushTickets("""
                {"data":[
                  {"status":"ok","id":"ticket-1"},
                  {"status":"error","message":"Unregistered",
                    "details":{"error":"DeviceNotRegistered"}}
                ]}
                """);

        assertThat(results).hasSize(2);
        assertThat(results.get(0).ticketId()).isEqualTo("ticket-1");
        assertThat(results.get(1).error()).isEqualTo("DeviceNotRegistered");
    }

    @Test
    void parsesPushReceiptsByTicketId() throws Exception {
        Map<String, PushResult> receipts = NotificationService.parsePushReceipts("""
                {"data":{
                  "ticket-ok":{"status":"ok"},
                  "ticket-stale":{"status":"error","message":"Unregistered",
                    "details":{"error":"DeviceNotRegistered"}}
                }}
                """);

        assertThat(receipts.get("ticket-ok").error()).isNull();
        assertThat(receipts.get("ticket-stale").error()).isEqualTo("DeviceNotRegistered");
    }

    @Test
    void treatsMalformedTicketAsAnError() throws Exception {
        PushResult result = NotificationService.parsePushTicket("""
                {"data":[{}]}
                """);

        assertThat(result.error()).isEqualTo("MalformedExpoResponse");
    }

    @Test
    void localizesPushMessagesForTurkishRecipients() {
        assertThat(NotificationService.localized("tr", "Ride started")).isEqualTo("Yolculuk başladı");
        assertThat(NotificationService.localized("tr", "Ayşe is on the way.")).isEqualTo("Ayşe yolda.");
        assertThat(NotificationService.localized("en", "Ride started")).isEqualTo("Ride started");
    }

    @Test
    void excludesNearbyBikerWhenNotScheduledOnlineToday() {
        DocumentSnapshot biker = mock(DocumentSnapshot.class);
        GeoPoint pickup = new GeoPoint(41.0, 29.0);
        GeoPoint bikerLocation = new GeoPoint(41.005, 29.005);
        // 2026-11-16 is Monday (dayIndex = 0 in Europe/Istanbul)
        Instant monday = Instant.parse("2026-11-16T10:00:00Z");
        Timestamp freshTimestamp = Timestamp.ofTimeSecondsAndNanos(monday.minusSeconds(30).getEpochSecond(), 0);

        when(biker.get("availableDays")).thenReturn(List.of(false, true, true, true, true, true, true));
        when(biker.get("currentLocation")).thenReturn(bikerLocation);
        when(biker.getTimestamp("locationUpdatedAt")).thenReturn(freshTimestamp);

        assertThat(NotificationService.isNearbyAvailableBiker(biker, pickup, monday)).isFalse();
    }

    @Test
    void includesNearbyBikerWhenScheduledOnlineToday() {
        DocumentSnapshot biker = mock(DocumentSnapshot.class);
        GeoPoint pickup = new GeoPoint(41.0, 29.0);
        GeoPoint bikerLocation = new GeoPoint(41.005, 29.005);
        // 2026-11-16 is Monday (dayIndex = 0 in Europe/Istanbul)
        Instant monday = Instant.parse("2026-11-16T10:00:00Z");
        Timestamp freshTimestamp = Timestamp.ofTimeSecondsAndNanos(monday.minusSeconds(30).getEpochSecond(), 0);

        when(biker.get("availableDays")).thenReturn(List.of(true, false, false, false, false, false, false));
        when(biker.get("currentLocation")).thenReturn(bikerLocation);
        when(biker.getTimestamp("locationUpdatedAt")).thenReturn(freshTimestamp);

        assertThat(NotificationService.isNearbyAvailableBiker(biker, pickup, monday)).isTrue();
    }

    @Test
    void includesNearbyBikerWhenAvailableDaysIsNull() {
        DocumentSnapshot biker = mock(DocumentSnapshot.class);
        GeoPoint pickup = new GeoPoint(41.0, 29.0);
        GeoPoint bikerLocation = new GeoPoint(41.005, 29.005);
        Instant monday = Instant.parse("2026-11-16T10:00:00Z");
        Timestamp freshTimestamp = Timestamp.ofTimeSecondsAndNanos(monday.minusSeconds(30).getEpochSecond(), 0);

        when(biker.get("availableDays")).thenReturn(null);
        when(biker.get("currentLocation")).thenReturn(bikerLocation);
        when(biker.getTimestamp("locationUpdatedAt")).thenReturn(freshTimestamp);

        assertThat(NotificationService.isNearbyAvailableBiker(biker, pickup, monday)).isTrue();
    }

    @Test
    void excludesNearbyBikerWhenTodayIsFalseUsingInstantNow() {
        DocumentSnapshot biker = mock(DocumentSnapshot.class);
        GeoPoint pickup = new GeoPoint(41.0, 29.0);
        int todayIndex = Instant.now().atZone(ZoneId.of("Europe/Istanbul")).getDayOfWeek().getValue() - 1;
        List<Boolean> availableDays = new ArrayList<>(Collections.nCopies(7, true));
        availableDays.set(todayIndex, false);

        when(biker.get("availableDays")).thenReturn(availableDays);
        when(biker.get("currentLocation")).thenReturn(pickup);
        when(biker.getTimestamp("locationUpdatedAt")).thenReturn(Timestamp.now());

        assertThat(NotificationService.isNearbyAvailableBiker(biker, pickup)).isFalse();
    }
}
