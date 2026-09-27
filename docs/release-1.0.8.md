# Hisab Pagar 1.0.8 — release sheet

- **Version:** 1.0.8 · versionCode assigned by EAS (expected 14)
- **Release:** tag `v1.0.8` → EAS workflow → Play Internal testing
- **Why:** first device test of 1.0.7 (Xiaomi, Android 16) found two problems in the
  Google Drive sign-in, both in the app:
  1. After consent, expo-router rendered **"Unmatched Route"** for the redirect URL
     `com.kaambook.app:/oauth2redirect?code=…`.
  2. The phone killed the app while Google's sheet was open, so the redirect
     cold-started the app and the in-memory sign-in (PKCE verifier) was gone.
  A third problem was on the Google Cloud side and is already fixed there: the Android
  OAuth client needs **Advanced settings → Enable custom URI scheme** (see
  `docs/google-drive-setup.md`).

## What changed
- `app/oauth2redirect.tsx`: route for the redirect URL that immediately goes back (or to
  Home on cold start) instead of showing "Unmatched Route".
- `googleDrive.ts`: the sign-in's state + PKCE verifier are saved in SecureStore before
  the Google sheet opens; on app start `completeColdStartAuth()` checks the initial URL,
  exchanges the code itself, connects the account, then restores (onboarding) or uploads.
  Events: `drive_connected {cold_start: true}`, `drive_connect_cold_start_rejected {reason}`,
  error `drive_connect_cold_start`.

## Verify on Internal testing
- Settings → Connect Google Drive → Google sheet → Continue → back in the app on Settings
  (no "Unmatched Route"), row shows "Automatic backup is on · Connected as … · Last backup".
- Force the cold-start path: open the sheet, swipe the app away from Recents (or let MIUI
  kill it), then finish consent → app starts on Home, Settings shows connected.
- Uninstall / reinstall → onboarding → Restore from Google Drive → Home shows staff.

## Play Console → Release notes
Same as 1.0.7 (the feature is new to users); 1.0.7 was never promoted to Production.
