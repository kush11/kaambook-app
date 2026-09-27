# Google Drive automatic backup — one-time setup

The app code is done; the feature stays hidden until `GOOGLE_ANDROID_CLIENT_ID` in
`src/config/googleDrive.ts` is filled in. That needs an OAuth client in Google Cloud.
About 15 minutes, no cost.

## How it works (for reference)

- The owner taps **Connect Google Drive** (Home card, Settings, or "Restore" on onboarding).
- Google's sign-in sheet asks for one permission: *"See, create, and delete its own
  configuration data in your Google Drive"* (`drive.appdata`). This is the hidden per-app
  folder — the app can never see the user's real Drive files.
- The app keeps the refresh token in Android's encrypted storage (`expo-secure-store`) and
  uploads `hisabpagar-backup.json` (the same JSON as "Backup Data") to that folder at most
  once every 20 hours, on app open or when the app returns to the foreground.
- On a fresh install the owner taps **Restore from Google Drive** on the onboarding screen;
  the backup is pulled and the app opens on Home with everything back.
- Safety: an empty database never overwrites an existing Drive backup.
- Nothing touches our servers. The only thing stored on the phone besides tokens is the
  Google account email, shown in Settings.

## 1. Google Cloud project

Use the existing project **kaambook-app** (the one that holds the Play service account)
at https://console.cloud.google.com — signed in as the Play Console owner account.

1. **APIs & Services → Library** → search *Google Drive API* → **Enable**.
2. **APIs & Services → OAuth consent screen** (now "Google Auth Platform → Branding"):
   - User type: **External**.
   - App name: `Hisab Pagar`. Support email: the Play Console owner email.
   - App logo: optional (adding one triggers a brand review; skip it).
   - Authorised domain: `kush11.github.io` (where the privacy policy lives).
   - Privacy policy link: `https://kush11.github.io/kaambook-app/privacy-policy.html`.
   - Scopes: add `https://www.googleapis.com/auth/drive.appdata`, `openid`, `email`.
     All three are **non-sensitive**, so no Google verification review is needed.
   - Publishing status: **In production** (Testing mode caps sign-ins at 100 users and
     expires tokens after 7 days, which would break the daily backup).

## 2. The Android OAuth client

**APIs & Services → Credentials → Create credentials → OAuth client ID**:

- Application type: **Android**
- Name: `Hisab Pagar (Play)`
- Package name: `com.kaambook.app`
- SHA-1: the **App signing key certificate** fingerprint from Play Console →
  *Protected with Play → App signing*. This is the key Google re-signs the app with on
  users' phones, **not** the EAS upload key. As of 28 Sept 2026 it is
  `06:49:DD:11:D6:08:59:53:34:37:3E:58:25:C7:16:A7:F9:A3:46:2A`
  (SHA-256 `9B:A9:10:B0:BF:CE:EB:FA:F5:AB:A3:E6:50:D9:21:63:77:88:E0:A6:DD:61:F9:EE:DA:66:1F:08:36:55:63:83`).

Copy the Client ID (looks like `1234567890-abc…xyz.apps.googleusercontent.com`).

Optional: a second Android client with the EAS upload key SHA-1
(`85:C4:16:FF:81:83:20:2B:38:4B:DA:5E:6E:CE:7E:CB:42:DB:27:B0`) if you want sideloaded
EAS artefacts (not installed through Play) to be able to connect too. The app only
uses one client ID, so this is rarely worth it.

## 3. Wire it into the app

1. `src/config/googleDrive.ts` → `GOOGLE_ANDROID_CLIENT_ID = '<client id>'`.
2. `app.json` already lists `com.kaambook.app` as a URL scheme; the OAuth redirect is
   `com.kaambook.app:/oauth2redirect`. Nothing else to change.
3. Build on EAS and install from Play (Internal testing is fine — Play re-signs it with
   the app signing key, which is what the OAuth client checks).

## 4. Verify on a phone

- Settings → Backup → **Connect Google Drive** → Google sheet → pick account → the row
  turns into "Automatic backup is on · Connected as … · Last backup: just now".
- PostHog: `drive_connected {source}` then `drive_backup_uploaded {auto:false}`.
- Uninstall, reinstall from Play → onboarding → **Already used Hisab Pagar? Restore from
  Google Drive** → sign in → Home shows the staff again. PostHog: `drive_restore_completed`.
- Next day, open the app: `drive_backup_uploaded {auto:true}` without any prompt.

## Analytics events

| Event | When |
|---|---|
| `drive_connected` `{source}` | account linked (settings / home_card / onboarding) |
| `drive_connect_cancelled`, error `drive_connect` | sheet dismissed / failed |
| `drive_backup_uploaded` `{auto, staff_count, bytes}` | file written to Drive |
| `drive_backup_skipped_empty` | empty DB refused to overwrite a real backup |
| `drive_restore_completed` `{staff_count}` / `drive_restore_empty` | restore result |
| `drive_disconnected` | "Turn off automatic backup" |
| error `drive_auto_backup` | silent daily upload failed (token, network, quota) |

## Play Console after release

- **Data safety** form: add *"App activity → Other app activity"*? No — the backup goes to
  the user's own Drive, not to you, so the existing answers stand. Do add the Google
  account email under *Personal info → Email address* → collected, not shared, stored
  on device only, used for app functionality.
- Privacy policy: `docs/privacy-policy.html` already has the Google Drive paragraph.
