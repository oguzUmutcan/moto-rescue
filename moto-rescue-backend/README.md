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
GOOGLE_MAPS_API_KEY=
GOOGLE_DIRECTIONS_API_KEY=
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
POST /api/rescues/{requestId}/start
POST /api/rescues/{requestId}/complete
```

Passenger and biker roles are loaded from `users/{uid}.role` in Firestore. The backend derives the user identity from the verified token; client-provided user IDs are not accepted.
An `activeRescueParticipants/{uid}` transaction lock prevents passengers from creating and bikers from accepting overlapping active rescues.

## Notification inbox API

Push events are also persisted in `userNotifications`, so users can recover
rescue activity after dismissing a system notification or opening the app
later. The document IDs are deterministic per user, event type, and rescue to
make delivery retries idempotent.

```text
GET   /api/notifications
PATCH /api/notifications/{notificationId}/read
PATCH /api/notifications/read-all
```

All inbox endpoints require a Firebase ID token and scope reads and updates to
the authenticated user.

## Google Places

Place autocomplete and detail lookups are proxied by the backend so the Google Maps Platform key is never bundled into the mobile application. Enable Places API (New) for the project and provide a server-restricted key:

```powershell
$env:GOOGLE_MAPS_API_KEY="your-restricted-server-key"
.\mvnw.cmd spring-boot:run
```

If `GOOGLE_MAPS_API_KEY` is absent or Google is temporarily unavailable, the frontend keeps the device geocoder and map selection as fallbacks.

## Google Routes

Route polylines and ETAs are computed by the backend so a Google web-service key
is never included in the JavaScript bundle:

```powershell
$env:GOOGLE_DIRECTIONS_API_KEY="your-server-restricted-routes-key"
.\mvnw.cmd spring-boot:run
```

Enable Routes API for this key and restrict it to the backend's deployment IPs
or network. If `GOOGLE_DIRECTIONS_API_KEY` is absent, the backend falls back to
`GOOGLE_MAPS_API_KEY`; in that case the same server key must allow both Places
API (New) and Routes API.

## Test

```powershell
.\mvnw.cmd clean test
```
