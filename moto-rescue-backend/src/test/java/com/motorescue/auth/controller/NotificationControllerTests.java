package com.motorescue.auth.controller;

import com.google.firebase.auth.FirebaseToken;
import com.motorescue.auth.dto.NotificationDtos.NotificationResponse;
import com.motorescue.auth.service.AuthService;
import com.motorescue.auth.service.NotificationInboxService;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class NotificationControllerTests {

    @Test
    void inboxOperationsAuthenticateAndStayScopedToTheCurrentUser() {
        AuthService authService = mock(AuthService.class);
        NotificationInboxService inboxService = mock(NotificationInboxService.class);
        FirebaseToken token = mock(FirebaseToken.class);
        NotificationController controller = new NotificationController(authService, inboxService);
        NotificationResponse notification = new NotificationResponse(
                "n1", "rescue_accepted", "passenger", "r1",
                "Accepted", "On the way", null, Instant.now()
        );
        when(authService.authenticate("Bearer token")).thenReturn(token);
        when(inboxService.list(token)).thenReturn(List.of(notification));
        when(inboxService.markRead(token, "n1")).thenReturn(notification);

        assertThat(controller.list("Bearer token")).containsExactly(notification);
        assertThat(controller.markRead("Bearer token", "n1")).isEqualTo(notification);
        controller.markAllRead("Bearer token");

        verify(inboxService).list(token);
        verify(inboxService).markRead(token, "n1");
        verify(inboxService).markAllRead(token);
    }
}
