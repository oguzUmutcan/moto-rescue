package com.motorescue.auth.service;

import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.firebase.auth.FirebaseToken;
import com.motorescue.auth.dto.BadgeDtos.BadgeResponse;
import com.motorescue.auth.dto.BadgeDtos.BadgeSummaryResponse;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.ExecutionException;

@Service
@ConditionalOnProperty(name = "firebase.enabled", havingValue = "true", matchIfMissing = true)
public class BadgeService {
    private static final ZoneId APP_ZONE = ZoneId.of("Europe/Istanbul");
    private final Firestore firestore;

    public BadgeService(Firestore firestore) {
        this.firestore = firestore;
    }

    public BadgeSummaryResponse mine(FirebaseToken token) {
        try {
            DocumentSnapshot profile = firestore.collection("users").document(token.getUid()).get().get();
            if (!profile.exists() || !"biker".equals(profile.getString("role"))) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "The biker role is required");
            }
            List<QueryDocumentSnapshot> completed = firestore.collection("rescueRequests")
                    .whereEqualTo("bikerId", token.getUid()).limit(500).get().get().getDocuments().stream()
                    .filter(document -> "completed".equals(document.getString("status")))
                    .sorted(Comparator.comparing(this::completedAt))
                    .toList();

            long total = completed.size();
            long exam = completed.stream().filter(document -> contains(document.getString("urgency"), "exam")).count();
            long helmet = completed.stream().filter(document -> Boolean.TRUE.equals(document.getBoolean("needsHelmet"))).count();
            long night = completed.stream().filter(document -> {
                int hour = completedAt(document).atZone(APP_ZONE).getHour();
                return hour >= 20 || hour < 6;
            }).count();
            Number ratingValue = (Number) profile.get("rating");
            Number ratingCountValue = (Number) profile.get("ratingCount");
            double rating = ratingValue == null ? 0 : ratingValue.doubleValue();
            long ratingCount = ratingCountValue == null ? 0 : ratingCountValue.longValue();

            List<BadgeResponse> badges = new ArrayList<>();
            badges.add(countBadge("first_rescue", "🏁", "First Rescue", "Complete your first rescue", total, 1, completed));
            badges.add(countBadge("rising_rescuer", "⚡", "Rising Rescuer", "Complete 5 rescues", total, 5, completed));
            badges.add(countBadge("city_hero", "🦸", "City Hero", "Complete 25 rescues", total, 25, completed));
            badges.add(countBadge("rescue_legend", "💯", "Rescue Legend", "Complete 100 rescues", total, 100, completed));
            badges.add(filteredBadge("exam_hero", "🎓", "Exam Hero", "Complete 5 exam rescues", exam, 5, completed, "exam"));
            badges.add(filteredBadge("helmet_hero", "⛑️", "Helmet Hero", "Complete 10 rescues requiring a helmet", helmet, 10,
                    completed.stream().filter(document -> Boolean.TRUE.equals(document.getBoolean("needsHelmet"))).toList(), null));
            badges.add(filteredBadge("night_rescuer", "🌙", "Night Rescuer", "Complete 10 rescues after 8 PM", night, 10,
                    completed.stream().filter(document -> {
                        int hour = completedAt(document).atZone(APP_ZONE).getHour();
                        return hour >= 20 || hour < 6;
                    }).toList(), null));
            boolean fiveStar = ratingCount >= 5 && rating >= 4.8;
            badges.add(new BadgeResponse("five_star", "⭐", "Top Rated Rider",
                    "Maintain 4.8+ rating after 5 reviews", Math.min(ratingCount, 5), 5, fiveStar, null));

            long xp = total * 50;
            String level = xp >= 3000 ? "Platinum" : xp >= 1500 ? "Gold" : xp >= 500 ? "Silver" : "Bronze";
            String emoji = xp >= 3000 ? "💎" : xp >= 1500 ? "🥇" : xp >= 500 ? "🥈" : "🥉";
            long floor = xp >= 3000 ? 3000 : xp >= 1500 ? 1500 : xp >= 500 ? 500 : 0;
            long ceiling = xp >= 3000 ? 3000 : xp >= 1500 ? 3000 : xp >= 500 ? 1500 : 500;
            String next = xp >= 3000 ? "Max level" : xp >= 1500 ? "Platinum" : xp >= 500 ? "Gold" : "Silver";
            return new BadgeSummaryResponse(level, emoji, xp, xp - floor, ceiling - floor, next, badges);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw unavailable(exception);
        } catch (ExecutionException exception) {
            throw unavailable(exception);
        }
    }

    private BadgeResponse countBadge(String id, String emoji, String name, String description,
                                     long progress, long target, List<QueryDocumentSnapshot> documents) {
        return new BadgeResponse(id, emoji, name, description, Math.min(progress, target), target,
                progress >= target, progress >= target ? completedAt(documents.get((int) target - 1)) : null);
    }

    private BadgeResponse filteredBadge(String id, String emoji, String name, String description,
                                        long progress, long target, List<QueryDocumentSnapshot> documents, String urgency) {
        List<QueryDocumentSnapshot> matching = urgency == null ? documents : documents.stream()
                .filter(document -> contains(document.getString("urgency"), urgency)).toList();
        return new BadgeResponse(id, emoji, name, description, Math.min(progress, target), target,
                progress >= target, progress >= target ? completedAt(matching.get((int) target - 1)) : null);
    }

    private boolean contains(String value, String needle) {
        return value != null && value.toLowerCase().contains(needle);
    }

    private Instant completedAt(DocumentSnapshot document) {
        Timestamp value = document.getTimestamp("completedAt");
        if (value == null) value = document.getTimestamp("createdAt");
        return value == null ? Instant.EPOCH : value.toDate().toInstant();
    }

    private ResponseStatusException unavailable(Exception exception) {
        return new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Firestore operation failed", exception);
    }
}
