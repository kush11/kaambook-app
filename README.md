# Hisab Pagar — staff attendance & salary app

Offline-first Android app for small Indian businesses (shops, factories, contractors) to
mark daily staff attendance (haziri), calculate salaries, record payments and advances,
keep a cashbook, and share PDF salary slips on WhatsApp — in 10 Indian languages.

- **Play Store:** https://play.google.com/store/apps/details?id=com.kaambook.app
- **Package:** `com.kaambook.app` (repo and Google Cloud project are called *kaambook*;
  the product name is *Hisab Pagar*)
- **Privacy policy:** https://kush11.github.io/kaambook-app/privacy-policy.html
  (source: `docs/privacy-policy.html`, published from `/docs` on `master`)
- **Changelog:** [CHANGELOG.md](CHANGELOG.md) — one entry per Play release

## Features

- Staff register with salary type (monthly / daily / weekly), overtime rate, weekly offs,
  contact-picker import
- One-tap daily attendance (P / A / ½), bulk "Present all" / "Holiday", monthly calendar
- Automatic salary due, payments and advances, salary slip PDF with share
- Cashbook (income / expense by category)
- AI monthly summary (Gemini, via a Cloudflare Worker so the key never ships in the app)
- Daily attendance reminder notification
- Backups: manual JSON export/import, and automatic backup to the owner's Google Drive
  (private app-data folder) with restore on reinstall
- English, Hindi, Gujarati, Marathi, Punjabi, Bengali, Tamil, Telugu, Kannada, Odia

## Stack

Expo SDK 54 / React Native · expo-router · react-native-paper · zustand ·
drizzle-orm on expo-sqlite (all data on device) · i18n-js · PostHog (analytics) ·
Sentry (crashes) · expo-notifications · expo-auth-session + Drive REST API (backup) ·
expo-store-review.

```
app/            expo-router routes: (tabs)/home|cashbook|salary-due|settings, staff/, business/, onboarding
src/components  UI, grouped by screen (home/, staff/, settings/, ui/)
src/stores      zustand stores: settings, business, staff, attendance, payments, cashbook
src/db          drizzle schema, client, seed
src/i18n        one JSON per language + index.ts
src/utils       analytics, backup, googleDrive, notifications, report (PDF), salary, reviewPrompt
src/config      telemetry.ts (PostHog key, Sentry DSN), googleDrive.ts (OAuth client id), links.ts
ai-proxy/       Cloudflare Worker for the AI summary (README inside)
docs/           privacy policy, Play listing copy, per-release sheets, Drive setup guide
scripts/        verify-salary.ts — salary calculation checks
.eas/workflows  release-android.yml — tag → EAS build → Play Internal testing
```

## Development

```bash
yarn install                 # runs patch-package (expo-contacts crash fix)
npx expo start               # Metro; use a dev build or Expo Go for JS-only changes
npx tsc --noEmit             # typecheck
npx tsx scripts/verify-salary.ts   # salary calculation tests
```

`android/` is git-ignored and generated. A local Gradle build (`cd android && ./gradlew
assembleRelease`) gives a sideloadable test APK signed with the local keystore; Play
rejects local bundles, and Google sign-in for Drive backup only works on Play-installed
builds (the OAuth client is bound to the Play app-signing key). Details in
[RELEASE.md](RELEASE.md).

Configuration lives in `src/config/`. Every integration is a safe no-op when its key is
empty: PostHog, Sentry, Google Drive (`GOOGLE_ANDROID_CLIENT_ID`), AI proxy URL. None of
those values are secrets — they ship inside the APK — so they are committed.
The secrets (Gemini key, Play service-account JSON, keystores) are **not** in the repo:
Gemini lives as a Worker secret, the service account key in EAS credentials.

## Releasing

The normal path is the EAS workflow; the full guide is [RELEASE.md](RELEASE.md).

1. Write `docs/release-<version>.md` (what changed, how to verify, Play release notes in
   en-GB / en-IN / hi-IN) and add the entry to `CHANGELOG.md`.
2. Bump `"version"` in `app.json`, commit to `master`. versionCode is assigned by EAS
   (remote, auto-increment); `android/app/build.gradle` is only kept in sync for local builds.
3. Tag and push — this triggers `.eas/workflows/release-android.yml`, which builds on EAS
   and submits to **Play → Internal testing** with the service account:
   ```bash
   git tag -a v1.0.8 -m "1.0.8"
   git push origin v1.0.8
   ```
   Watch it at https://expo.dev/accounts/kush636/projects/kaambook-app/workflows
   (or `npx eas workflow:runs`).
4. Install from Internal testing on a phone and run the checklist in the release sheet.
5. Play Console → Internal testing → **Promote release → Production**, paste the release
   notes. The service account deliberately cannot release to production.
6. Publish the GitHub release for the tag so the history is in one place:
   ```bash
   gh release create v1.0.8 --title "1.0.8" --notes-file docs/release-1.0.8.md
   ```
7. Update the status column in `CHANGELOG.md` (Internal testing → Production) and, if the
   privacy policy changed, check the GitHub Pages copy is live.

Release history: `CHANGELOG.md` (summary table + notes), `docs/release-*.md` (full
sheets), git tags `v*`, GitHub Releases, and the EAS build / submission ids recorded in
each sheet.

## Analytics

PostHog project 619592 (US). Events carry `$app_version` / `$app_build`; the owner's
phone number becomes the person identity after onboarding, so **group by `person_id`,
not `distinct_id`**, or every user is counted twice. Key events: `onboarding_completed`,
`staff_added`, `attendance_marked`, `cashbook_entry_added`, `report_shared`, `app_shared`,
`reminder_auto_enabled`, `first_attendance_nudge`, `review_requested`, `drive_*`,
`error_occurred`.
