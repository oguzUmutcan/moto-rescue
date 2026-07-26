package com.motorescue.auth.service;

import com.motorescue.auth.service.NotificationInboxService.InboxMessage;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class NotificationInboxServiceTests {

    @Test
    void usesOneStableDocumentForEachUserRequestEvent() {
        InboxMessage message = new InboxMessage(
                "user-1", "rescue_accepted", "passenger", "request-1", "Accepted", "On the way"
        );

        assertThat(NotificationInboxService.documentId(message))
                .isEqualTo("user-1--rescue_accepted--request-1");
    }
}
