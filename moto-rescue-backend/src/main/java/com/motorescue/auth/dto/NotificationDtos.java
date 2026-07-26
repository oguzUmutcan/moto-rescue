package com.motorescue.auth.dto;

import java.time.Instant;

public final class NotificationDtos {
    private NotificationDtos() {}

    public record NotificationResponse(
            String id,
            String type,
            String role,
            String requestId,
            String title,
            String body,
            Instant readAt,
            Instant createdAt
    ) {}
}
