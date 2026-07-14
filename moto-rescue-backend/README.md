# MotoRescue Backend

Spring Boot backend for server-authoritative rescue request state.

## Requirements

- Java 21+
- Firebase project with Authentication and Firestore
- Application Default Credentials with Firebase Authentication and Firestore access

Never place a service-account JSON file in this repository. For local development, point `GOOGLE_APPLICATION_CREDENTIALS` to a credential file stored outside the workspace:

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\secure\motorescue-service-account.json"
.\mvnw.cmd spring-boot:run
```

In Google Cloud deployments, attach a least-privilege service account to the runtime instead of using a JSON key.

## Configuration

```text
FIREBASE_ENABLED=true
FIREBASE_PROJECT_ID=motorescue-d4abc
SERVER_PORT=8083
CORS_ALLOWED_ORIGINS=http://localhost:8081,http://localhost:19006
```

The server listens on port `8083` by default. Override it with the `SERVER_PORT` environment variable when needed.

## Rescue API

All endpoints require `Authorization: Bearer <Firebase ID token>`.

```text
POST /api/rescues
GET  /api/rescues/{requestId}
GET  /api/rescues/open
POST /api/rescues/{requestId}/accept
POST /api/rescues/{requestId}/cancel
```

Passenger and biker roles are loaded from `users/{uid}.role` in Firestore. The backend derives the user identity from the verified token; client-provided user IDs are not accepted.

## Test

```powershell
.\mvnw.cmd clean test
```
