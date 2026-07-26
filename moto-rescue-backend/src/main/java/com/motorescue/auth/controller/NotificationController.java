package com.motorescue.auth.controller;

import com.motorescue.auth.dto.NotificationDtos.NotificationResponse;
import com.motorescue.auth.service.AuthService;
import com.motorescue.auth.service.NotificationInboxService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@ConditionalOnProperty(name = "firebase.enabled", havingValue = "true", matchIfMissing = true)
public class NotificationController {
    private final AuthService authService;
    private final NotificationInboxService notificationInboxService;

    public NotificationController(AuthService authService, NotificationInboxService notificationInboxService) {
        this.authService = authService;
        this.notificationInboxService = notificationInboxService;
    }

    @GetMapping
    public List<NotificationResponse> list(@RequestHeader("Authorization") String authorization) {
        return notificationInboxService.list(authService.authenticate(authorization));
    }

    @PatchMapping("/{notificationId}/read")
    public NotificationResponse markRead(
            @RequestHeader("Authorization") String authorization,
            @PathVariable String notificationId
    ) {
        return notificationInboxService.markRead(
                authService.authenticate(authorization),
                notificationId
        );
    }

    @PatchMapping("/read-all")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markAllRead(@RequestHeader("Authorization") String authorization) {
        notificationInboxService.markAllRead(authService.authenticate(authorization));
    }
}
