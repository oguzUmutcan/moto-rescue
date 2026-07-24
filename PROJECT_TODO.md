# MotoRescue TODO

## Immediate validation

feat/backend-api-consolidation
- [ ] Install the latest EAS development APK on the test devices before its artifact expires.
- [ ] Test rescue push notifications with a physical Android device.
- [ ] Fix passenger active-rescue restoration when returning to the dashboard:
  - [ ] Refresh `rescueApi.active()` whenever the dashboard regains focus, not only on its initial mount.
  - [ ] Replace the constant "No active request" card with the real active rescue state.
  - [ ] Let the passenger reopen the correct searching or active-ride screen after swiping back.
- [ ] Make the biker dashboard rescue call-to-action reflect real request state:
  - [ ] Do not show a constant orange "View Rescue Request" action while no request exists.
  - [ ] Show or enable the action only when `pendingRequestId` is available.
  - [ ] Restore an accepted or in-progress rescue when the dashboard regains focus.
- [ ] Verify the full passenger and biker rescue flow:
  - [ ] Nearby rescue notification

- [x] Add complete English/Turkish language preferences:
  - [x] Let users choose a language on the first onboarding screen and in both profile/settings screens.
  - [x] Apply language changes immediately across screens, alerts, placeholders, navigation labels, dates, errors, and push notifications.
  - [x] Persist the preference locally and restore the account preference from Firestore after sign-in.
  - [x] Fall back to the device language before an account can be identified after a clean reinstall.
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
- [ ] Finish the full passenger and biker notification test:
  - [x] Nearby rescue notification

  - [ ] Rescue accepted notification
  - [ ] Rescue started notification
  - [ ] Rescue completed notification
  - [ ] Rescue cancelled notification
feat/backend-api-consolidation
  - [ ] Notification-tap routing
- [ ] Re-test login and existing-profile restoration.
- [ ] Verify the duplicate-email registration error.
- [ ] Verify Firebase user cleanup when backend profile creation fails.

## Repository and build hygiene

- [ ] Use `C:\src\MotoRescue` as the authoritative checkout for native Android work.
- [ ] Reconcile the Desktop and short-path checkouts so fixes are not duplicated or lost.
- [ ] Keep APKs and backend log files out of commits.
- [ ] Add an `.easignore` to exclude generated and unnecessary files from EAS uploads.
- [ ] Commit and push remaining intended changes on a feature branch, not `master`.

## Dependencies and quality

- [ ] Plan compatible fixes for the 25 npm audit findings (21 moderate and 4 high).
- [ ] Add frontend automated tests for authentication, restoration, and rescue-state navigation.
- [ ] Expand backend tests around the complete rescue state machine and notification decisions.
- [ ] Parse Expo push tickets and query delivery receipts instead of treating every HTTP 2xx response as successful delivery.
- [ ] Remove stale or `DeviceNotRegistered` Expo push tokens when Expo reports them.
- [ ] Re-run backend tests, TypeScript, lint, Expo Doctor, and `git diff --check` before merging.

## Product limitations

- [ ] Add background location tracking with an explicit battery/privacy policy.
- [ ] Add in-app route polylines and real ETA calculations.
- [ ] Decide whether phone-number verification is required and, if so, use a backend OTP provider that does not depend on Play Integrity.
=======
  - [x] Notification-tap routing
- [ ] Re-test login and existing-profile restoration.
- [x] Verify the duplicate-email registration error with an automated workflow test.
- [x] Verify Firebase user cleanup when backend profile creation fails with an automated workflow test.

## Repository and build hygiene

- [x] Use `C:\src\MotoRescue` as the authoritative checkout for native Android work.
- [ ] Archive or remove the obsolete Desktop checkout after all intended changes are confirmed in the short checkout.
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
- [ ] Implement robust background location handling on both iOS and Android.
- [ ] Design in-app route polylines and real ETA calculations.
- [ ] Decide whether phone-number verification is required and, if so, select a backend OTP provider that does not depend on Play Integrity.

- [ ] Review whether polling should remain after push delivery is proven reliable.
