# Hisab Pagar 1.0.7 — release sheet

- **Version:** 1.0.7 (EAS auto-increments versionCode; expected 12)
- **Bundle:** built on Expo (EAS), `eas build --platform android --profile production`
- **Signed with:** the EAS-managed upload key; Play re-signs with the app-signing key,
  which is the SHA-1 registered on the Google OAuth client — so **only Play-installed
  builds can connect Google Drive**. A sideloaded EAS artefact will fail at sign-in.

## What's new

**Google Drive automatic backup** (`docs/google-drive-setup.md` has the mechanics):
- Home shows "Never lose your records" with **Connect Google Drive** once there is staff.
- Settings → Backup: connected account, last backup time, Back up now, Restore, Turn off.
- Onboarding: "Already used Hisab Pagar? Restore from Google Drive" for reinstalls / new phones.
- Silent upload at most once every 20 hours on app open or foreground.
- Google asks for one permission: the app's own hidden Drive folder, plus the account email.

## Verify on Internal testing (do this before Production)

1. Fresh install from Play → onboarding → Get started → add one staff → the Drive card shows
   on Home → Connect → Google sheet lists one Drive permission + email → returns to the app,
   card disappears. PostHog: `drive_connected {source: home_card}`, `drive_backup_uploaded {auto: false}`.
2. Settings → Backup shows "Automatic backup is on · Connected as … · Last backup: …".
3. Uninstall → reinstall from Play → onboarding → "Restore from Google Drive" → sign in →
   Home shows the staff again. PostHog: `drive_restore_completed`.
4. Next day: open the app → `drive_backup_uploaded {auto: true}` with no prompt.

If step 1 shows Google's "Error 400 / invalid_request" or "app not verified", check the
OAuth client's package name + SHA-1 and that the consent screen is "In production".

## Play Console → Release notes

**en-GB / en-IN**
```
• New: automatic backup to your Google Drive — never lose your staff and attendance records
• Restore everything on a new phone or after reinstalling
• Small fixes
```

**hi-IN**
```
• नया: आपके Google Drive में ऑटोमैटिक बैकअप — स्टाफ और हाज़िरी का रिकॉर्ड कभी नहीं खोएगा
• नया फ़ोन लेने या ऐप दोबारा इंस्टॉल करने पर सारा डेटा वापस पाएं
• छोटे सुधार
```

## Play Console → Data safety

No change needed: the backup goes to the user's own Google Drive, and the Google account
email is only stored on the device. If a reviewer asks, the privacy policy's "Google Drive
Backup" section is the reference.
