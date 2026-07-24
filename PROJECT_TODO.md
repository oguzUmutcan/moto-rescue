# MotoRescue TODO

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
