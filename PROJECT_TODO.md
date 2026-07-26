# MotoRescue TODO

## 26 July hardening

- [x] Deny direct Firestore profile/rescue writes and keep application data backend-authoritative.
- [x] Initialize Firebase Auth with AsyncStorage persistence on native platforms.
- [x] Wait for persisted authentication before foreground and background API calls.
- [x] Prevent passengers and bikers from holding overlapping active rescues.
- [x] Recheck biker eligibility transactionally when a rescue is accepted.
- [x] Move route geometry and ETA requests behind an authenticated backend endpoint.
- [x] Batch Expo push requests and run notification delivery outside rescue request threads.
- [x] Clear all current npm audit findings with Expo 54-compatible patches.
- [x] Remove lint warnings and add auth, polyline, route, notification-batch, and eligibility tests.
- [x] Deploy the updated Firestore rules to Firebase project `motorescue-d4abc`.
- [x] Enable Routes API and allow it on the API-restricted backend
      `GOOGLE_MAPS_API_KEY`.
- [x] Rebuild the Android debug client from the short `C:\mr` build mirror.
- [ ] Install the rebuilt client and repeat the two-device manual smoke tests.

## 26 July dashboard and notification fixes

- [x] Use backend profile names for new rescue and review snapshots.
- [x] Repair legacy `"User"` labels on read from the current user profile.
- [x] Turn the passenger search bar into a destination-first rescue shortcut.
- [x] Add a persistent activity inbox with unread counts and read controls.
- [x] Auto-present nearby requests to focused, online biker dashboards.
- [x] Handle foreground, notification-tap, and cold-start rescue notifications.
- [x] Deduplicate incoming request sheets across polling and push navigation.
- [x] Deploy backend revision `moto-rescue-api-00006-trx` to Cloud Run.
- [x] Rebuild and preserve the updated Android debug client.
- [ ] Repeat the incoming-request flow on two physical accounts/devices,
      including foreground, background, cold start, decline, and notification tap.

## Immediate validation

- [x] Install the latest EAS development APK on a physical Android device and emulator.
- [x] Confirm that a rescue push notification reaches the physical Android device.
- [x] Fix passenger active-rescue restoration when returning to the dashboard:
  - [x] Refresh `rescueApi.active()` whenever the dashboard regains focus.
  - [x] Replace the constant "No active request" card with the real active rescue state.
  - [x] Let the passenger reopen the correct searching or active-ride screen after swiping back.
- [x] Make the biker dashboard rescue call-to-action reflect real request state:
  - [x] Hide the rescue action when no pending or active request exists.
  - [x] Show the action only for a real pending or active rescue.
  - [x] Restore an accepted or in-progress rescue when the dashboard regains focus.
- [x] Finish the full passenger and biker notification test:
  - [x] Nearby rescue notification
  - [x] Rescue accepted notification
  - [x] Rescue started notification
  - [x] Rescue completed notification
  - [x] Rescue cancelled notification
  - [x] Notification-tap routing
- [x] Re-test login and existing-profile restoration.
- [x] Verify the duplicate-email registration error with an automated workflow test.
- [x] Verify Firebase user cleanup when backend profile creation fails with an automated workflow test.

## Repository and build hygiene

- [x] Use `C:\src\MotoRescue` as the authoritative checkout for native Android work.
- [x] Archive or remove the obsolete Desktop checkout after all intended changes are confirmed in the short checkout. (Requires manual action from user)
- [x] Keep APKs and backend log files out of commits.
- [x] Add an `.easignore` to exclude generated and unnecessary files from EAS uploads.
- [x] Commit and push the intended changes on the feature branch, not `master`.

## Dependencies and quality

- [x] Plan compatible fixes for the current npm audit findings.
- [x] Add frontend automated tests for authentication, restoration, and rescue-state navigation.
- [x] Expand backend tests around the complete rescue state machine and notification decisions.
- [x] Parse Expo push tickets and query delivery receipts instead of treating every HTTP 2xx response as successful delivery.
- [x] Remove stale or `DeviceNotRegistered` Expo push tokens when Expo reports them.
- [x] Re-run backend tests, frontend tests, TypeScript, lint, Expo Doctor, and `git diff --check` before merging.

## Product decisions

- [x] Design background location tracking with an explicit battery and privacy policy.
- [x] Implement robust background location handling on both iOS and Android.
- [x] Design in-app route polylines and real ETA calculations.
- [x] Decide whether phone-number verification is required and, if so, select a backend OTP provider that does not depend on Play Integrity. (Decided to stick with current Firebase configuration)
- [x] Review whether polling should remain after push delivery is proven reliable. (Decided to keep it as a fallback)
