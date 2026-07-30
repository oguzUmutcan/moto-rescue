# MotoRescue Session Handoff

Last updated: 26 July 2026

## Repository state

- Current branch: `fix/review-dashboard-notifications`
- Base commit before this hardening session: `c1e2181`
- Remote: `https://github.com/oguzUmutcan/moto-rescue.git`
- Application fixes are committed and pushed:
  - `e86016d` — review names, passenger dashboard actions, notification
    inbox, and incoming-request presentation/deduplication.
  - `9887027` — npm 10-compatible dependency lockfile for EAS builds.
- The successful EAS build was produced from `9887027`.
- The current working tree also contains uncommitted package manifest/lock
  changes that add `lightningcss-win32-x64-msvc`. They are not part of the
  successful EAS build commit and must be reviewed separately before staging.
- Current checkout:
  `C:\Users\umuto\Desktop\Lecture\zMy Works\Actual Projects\MotoRescue`
- A secret-free frontend build mirror exists at `C:\mr`. The Desktop path
  and even `C:\src\MotoRescue\moto-rescue-frontend` exceed Ninja's native
  object-path limit for `react-native-keyboard-controller`.

## Architecture

- Frontend: Expo SDK 54, React Native 0.81, React 19.1, Expo Router,
  NativeWind, Firebase JS Auth/Storage, Expo notifications and location.
- Backend: Spring Boot 4.1, Java 21 target, Firebase Admin, Firestore,
  Google Places and Routes proxies; default port `8083`.
- Firebase ID tokens authenticate every application API request.
- Profiles, roles, rescue state, reviews, badges, availability, and ratings
  are backend-authoritative.
- Rescue state: `searching -> accepted -> in_progress -> completed`.
- Passenger cancellation is allowed only before the ride starts.
- Push notifications are primary; focus-aware polling remains a fallback.

## 26 July hardening

### Backend authority and authentication

- Firestore rules now deny all direct client reads/writes to profile and
  rescue documents. Firebase Admin continues to access them after token and
  role validation.
- Native Firebase Auth now actually initializes with AsyncStorage
  persistence. The previous second `getApps()` check made that branch
  unreachable.
- API calls and background location tasks wait for Firebase auth restoration.
- A cached profile is cleared when Firebase restores a signed-out session.

### Rescue consistency

- `activeRescueParticipants/{uid}` transaction locks prevent passengers from
  creating and bikers from accepting overlapping active rescues.
- Legacy active rescues are checked before lock creation.
- Acceptance transactionally rechecks biker role, online state, contact
  phone, existing document-verification status, location freshness, and the
  6 km zone.
- Participant locks are removed on cancellation and completion.
- The existing one-minute licence auto-verification behavior was explicitly
  left unchanged by request.

### Routes and API keys

- Route geometry and ETA use authenticated `POST /api/directions`.
- The backend calls Google Routes API and returns an encoded polyline,
  distance, and duration.
- The frontend decodes and draws the polyline with `react-native-maps`;
  `react-native-maps-directions` was removed.
- `EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY` is now only for the native Android
  Maps SDK.
- Preferred backend configuration is `GOOGLE_DIRECTIONS_API_KEY`. It falls
  back to `GOOGLE_MAPS_API_KEY` when absent.
- Routes API is enabled on Firebase project `motorescue-d4abc`, and the
  existing API-restricted backend key now allows Places and Routes.
- The updated Firestore rules are deployed to `motorescue-d4abc`.

### Push delivery

- Notification methods run on a bounded 2-4 thread executor.
- Executor saturation uses caller backpressure instead of failing the rescue
  operation after its Firestore transaction has committed.
- Nearby-recipient messages are sent to Expo in batches of at most 100.
- Tickets remain associated with their recipient; stale token cleanup and
  scheduled receipt checks are preserved.

### Review names, dashboard actions, and request presentation

- Rescue and review snapshots now use the backend profile `name` before the
  Firebase token display name. New records no longer fall back to `"User"`
  when a real profile name exists.
- Existing rescue/review snapshots containing `"User"` are repaired on read
  from the current passenger or biker profile. Public biker reviews use the
  same fallback before anonymizing the passenger name.
- The passenger dashboard search bar now opens the rescue form with the
  destination input focused while current-location pickup continues loading.
- The passenger bell opens a persistent, authenticated activity inbox.
  Accepted, started, completed, nearby-request, and cancellation events are
  saved independently of push permission/token state. The dashboard badge is
  based on real unread records, and items support individual/read-all updates.
- A single in-memory presentation gate now coordinates biker polling,
  foreground pushes, notification taps, and cold-start responses.
  The focused online biker dashboard auto-opens the first eligible request;
  the gate prevents duplicate sheets, remembers declines until request expiry,
  and never reopens accepted requests.
- Expo SDK 54 notification lifecycle handling now covers foreground receive,
  response taps, and consumed cold-start responses.
- Cloud Run revision `moto-rescue-api-00006-trx` is deployed in
  `europe-west1` and serves 100% of `moto-rescue-api` traffic.

### Dependencies and quality

- `npm audit`: 0 known vulnerabilities.
- Compatible patch/override upgrades were used; Expo remains on SDK 54.
- Lint warnings for unused imports were removed.
- Added tests for native/web Firebase initialization, polyline decoding,
  backend Routes parsing/authentication, notification batches, biker
  eligibility, profile-name fallback, notification inbox routing, and
  incoming-request presentation/deduplication.
- A local Expo config plugin caps CMake object paths at 240 characters.
  A full four-ABI debug APK build passes from `C:\mr`.
- The verified debug artifact is preserved at
  `moto-rescue-frontend/.expo/native-build/motorescue-debug.apk`
  (216.09 MiB; SHA-256
  `F94BCF7FC3AE52A9802710B10EA52FE1CD3B891D0FBB8574710DC09829784C05`).

### EAS development build and dependency-install failure

- The first GitHub/EAS development build
  `3f1e8ff3-b356-434a-9c72-a7179a9e955e` failed during **Install
  dependencies**.
- EAS ran `npm ci --include=dev` with Node `20.19.4` and npm `10.8.2`.
  npm rejected the repository because `package.json` and
  `package-lock.json` did not describe the same dependency tree. Its report
  listed missing `concat-map`, `minimatch`, `brace-expansion`, and
  `balanced-match` entries.
- The `@testing-library/react-native@14.0.1` Node-engine message was only an
  `EBADENGINE` warning. It was not the cause of the failed build.
- Root cause: the lockfile had been generated under npm 11 while EAS
  performs an immutable clean install with npm 10. The earlier range-scoped
  transitive overrides did not resolve to a lock tree npm 10 could reproduce.
- The fix uses npm-10-compatible unversioned transitive overrides and a
  lockfile freshly generated with npm `10.8.2`. It is committed and pushed
  as `9887027`.
- The corrected lock was verified with both the normal and Linux-targeted
  EAS-equivalent clean installs:

  ```powershell
  npx npm@10.8.2 ci --include=dev --ignore-scripts --no-audit
  npx npm@10.8.2 ci --include=dev --ignore-scripts --no-audit --os=linux --cpu=x64
  ```

- After the lock fix, npm audit reported zero vulnerabilities, all 19
  frontend tests passed, and TypeScript and lint passed.
- Replacement development build
  `79a9dd1a-e418-4ea7-8e8c-c2a589f69eb7` finished successfully on 26 July
  2026:
  - Build page:
    `https://expo.dev/accounts/oguzumutcan/projects/moto-rescue/builds/79a9dd1a-e418-4ea7-8e8c-c2a589f69eb7`
  - APK:
    `https://expo.dev/artifacts/eas/IBSz6sITsH5LU7RlSfEiDYGI3L3mrgZbYWT872aGCKk.apk`
  - Profile/distribution: `development` / `internal`
  - EAS artifact expiration: 9 August 2026
- The remaining Node-engine warning should be handled later by aligning the
  EAS Node version with the testing-library requirement or selecting a
  compatible test-library version. It does not block the completed APK.

## Validation

The expected automated baseline after these changes is:

```text
Backend tests        32 passing
Frontend tests       19 passing
TypeScript           passing
Lint                 0 errors, 0 warnings
Expo Doctor          18/18
npm audit            0 vulnerabilities
Web export           passing
Android Metro export passing
Android debug APK    passing from C:\mr
Routes API smoke     passing
git diff --check     passing
```

Native Android compilation was run from the `C:\mr` build mirror because
Windows/Ninja cannot compile this dependency tree from the Desktop checkout.

## Required rollout

1. Install the rebuilt development client and manually verify:
   - login restoration after process death;
   - keyboard behavior on all edited forms;
   - passenger and biker overlap rejection;
   - route polyline and ETA;
   - background biker location;
   - accepted/started/completed/cancelled push delivery on two devices;
   - auto-open in foreground and after a normal app open;
   - cold-start notification taps;
   - one incoming sheet only when polling and push arrive together;
   - activity unread badge, item read, and read-all behavior.

## Local commands

Backend:

```powershell
cd moto-rescue-backend
.\mvnw.cmd test
.\mvnw.cmd spring-boot:run
```

Frontend:

```powershell
cd moto-rescue-frontend
npx npm@10.8.2 ci --include=dev
npm test
npx tsc --noEmit
npm run lint
npx expo-doctor
npm run start:dev-client
```
