package com.motorescue.auth.service;

import com.motorescue.auth.service.NotificationService.PushResult;
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
}
