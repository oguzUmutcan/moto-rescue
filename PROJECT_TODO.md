# MotoRescue TODO

## Immediate validation

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
  - [ ] Rescue accepted notification
  - [ ] Rescue started notification
  - [ ] Rescue completed notification
  - [ ] Rescue cancelled notification
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
- [ ] Review whether polling should remain after push delivery is proven reliable.
