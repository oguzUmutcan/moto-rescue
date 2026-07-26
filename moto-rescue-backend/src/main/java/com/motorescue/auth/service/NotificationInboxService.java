package com.motorescue.auth.service;

import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.SetOptions;
import com.google.cloud.firestore.WriteBatch;
import com.google.firebase.auth.FirebaseToken;
import com.motorescue.auth.dto.NotificationDtos.NotificationResponse;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@Service
@ConditionalOnProperty(name = "firebase.enabled", havingValue = "true", matchIfMissing = true)
public class NotificationInboxService {
    private static final String COLLECTION = "userNotifications";
    private final Firestore firestore;

    public NotificationInboxService(Firestore firestore) {
        this.firestore = firestore;
    }

    public List<NotificationResponse> list(FirebaseToken token) {
        try {
            return firestore.collection(COLLECTION)
                    .whereEqualTo("uid", token.getUid())
                    .limit(100)
                    .get().get().getDocuments().stream()
                    .map(this::from)
                    .sorted((left, right) -> compareNewest(left.createdAt(), right.createdAt()))
                    .toList();
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw unavailable(exception);
        } catch (ExecutionException exception) {
            throw unavailable(exception);
        }
    }

    public NotificationResponse markRead(FirebaseToken token, String notificationId) {
        DocumentReference reference = firestore.collection(COLLECTION).document(notificationId);
        try {
            firestore.runTransaction(transaction -> {
                DocumentSnapshot notification = transaction.get(reference).get();
                if (!notification.exists()) {
                    throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found");
                }
                if (!token.getUid().equals(notification.getString("uid"))) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Notification does not belong to this user");
                }
                if (notification.getTimestamp("readAt") == null) {
                    transaction.update(reference, "readAt", Timestamp.now());
                }
                return null;
            }).get();
            return from(reference.get().get());
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw unavailable(exception);
        } catch (ExecutionException exception) {
            if (exception.getCause() instanceof ResponseStatusException statusException) {
                throw statusException;
            }
            throw unavailable(exception);
        }
    }

    public void markAllRead(FirebaseToken token) {
        try {
            List<QueryDocumentSnapshot> unread = firestore.collection(COLLECTION)
                    .whereEqualTo("uid", token.getUid())
                    .limit(100)
                    .get().get().getDocuments().stream()
                    .filter(document -> document.getTimestamp("readAt") == null)
                    .toList();
            if (unread.isEmpty()) return;
            WriteBatch batch = firestore.batch();
            Timestamp now = Timestamp.now();
            unread.forEach(document -> batch.update(document.getReference(), "readAt", now));
            batch.commit().get();
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw unavailable(exception);
        } catch (ExecutionException exception) {
            throw unavailable(exception);
        }
    }

    public void save(InboxMessage message) {
        saveAll(List.of(message));
    }

    public void saveAll(List<InboxMessage> messages) {
        if (messages.isEmpty()) return;
        try {
            WriteBatch batch = firestore.batch();
            Timestamp createdAt = Timestamp.now();
            for (InboxMessage message : messages) {
                Map<String, Object> data = new HashMap<>();
                data.put("uid", message.uid());
                data.put("type", message.type());
                data.put("role", message.role());
                data.put("requestId", message.requestId());
                data.put("title", message.title());
                data.put("body", message.body());
                data.put("createdAt", createdAt);
                batch.set(
                        firestore.collection(COLLECTION).document(documentId(message)),
                        data,
                        SetOptions.merge()
                );
            }
            batch.commit().get();
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw unavailable(exception);
        } catch (ExecutionException exception) {
            throw unavailable(exception);
        }
    }

    static String documentId(InboxMessage message) {
        return message.uid() + "--" + message.type() + "--" + message.requestId();
    }

    private NotificationResponse from(DocumentSnapshot document) {
        return new NotificationResponse(
                document.getId(),
                document.getString("type"),
                document.getString("role"),
                document.getString("requestId"),
                document.getString("title"),
                document.getString("body"),
                instant(document.getTimestamp("readAt")),
                instant(document.getTimestamp("createdAt"))
        );
    }

    private int compareNewest(Instant left, Instant right) {
        if (left == null && right == null) return 0;
        if (left == null) return 1;
        if (right == null) return -1;
        return right.compareTo(left);
    }

    private Instant instant(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toDate().toInstant();
    }

    private ResponseStatusException unavailable(Exception exception) {
        return new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "Notification inbox operation failed",
                exception
        );
    }

    public record InboxMessage(
            String uid,
            String type,
            String role,
            String requestId,
            String title,
            String body
    ) {}
}
