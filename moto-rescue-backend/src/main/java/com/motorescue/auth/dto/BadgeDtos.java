package com.motorescue.auth.dto;

import java.time.Instant;
import java.util.List;

public final class BadgeDtos {
    private BadgeDtos() {}

    public record BadgeResponse(
            String id, String emoji, String name, String description,
            long progress, long target, boolean earned, Instant earnedAt
    ) {}

    public record BadgeSummaryResponse(
            String level, String levelEmoji, long xp, long currentLevelXp,
            long nextLevelXp, String nextLevel, List<BadgeResponse> badges
    ) {}
}
