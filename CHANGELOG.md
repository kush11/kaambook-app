# Changelog

All releases of Hisab Pagar (package `com.kaambook.app`). One entry per Play release,
newest first. Each entry links the detailed release sheet in `docs/` where one exists.
Version codes 6 and up were built on EAS; earlier ones were built locally.

| Version | versionCode | Date | EAS build | Play status |
|---|---|---|---|---|
| 1.0.7 | 12 | 2026-09-28 | `0b179a4d` | Internal testing |
| 1.0.6 | 11 | 2026-09-27 | `08fa496d` | Production |
| 1.0.5 | 10 | 2026-09-21 | `b7ee5040` | Production (superseded) |
| 1.0.4 | 8, 9 | 2026-06-26 | — | Production (superseded) |
| ≤ 1.0.3 | 1–7 | 2026-03 → 2026-06 | — | superseded |

## 1.0.7 — 2026-09-28 · [release sheet](docs/release-1.0.7.md)

### Added
- **Google Drive automatic backup.** Connect a Google account once; the app keeps one
  JSON backup in its private Drive app-data folder and refreshes it at most once every
  20 hours on app open. Home shows a "Never lose your records" card once there is staff;
  Settings → Backup shows the connected account, last backup, Back up now, Restore and
  Turn off; onboarding offers "Already used Hisab Pagar? Restore from Google Drive".
- Google Cloud OAuth client + consent screen (see `docs/google-drive-setup.md`).
- Privacy policy: Google Drive section and Google API Limited Use statement.

### Changed
- `backup.ts` split into `buildBackupData` / `restoreBackupData` so file and Drive
  backups share one code path.
- Release process now runs on EAS Workflows: pushing a `v*` tag builds and submits to
  the Internal testing track (`.eas/workflows/release-android.yml`).

## 1.0.6 — 2026-09-27 · [release sheet](docs/release-1.0.6.md)

Driven by PostHog data from 1.0.5: 8 of 9 real users added staff, only 4 ever marked
attendance, and the daily reminder was off by default.

### Added
- Saving the first staff member asks for notification permission and switches on the
  8 PM attendance reminder automatically (`reminder_auto_enabled` event).
- "Mark today's attendance for <name>" card on Home right after the first staff is added,
  with Present / Absent / Later (`first_attendance_nudge` event).

### Changed
- Play in-app review sheet now asks after 5 attendance marks across 2+ days instead of
  7 distinct days.
- New `first_attendance.*` strings in all 10 languages.

## 1.0.5 — 2026-09-21 · [release sheet](docs/release-1.0.5.md)

### Added
- PostHog product analytics (screen views, feature events, owner phone as identity) and
  Sentry error reporting; privacy policy and Play Data safety form updated to match.
- "Share this app" from Home and Settings with a tagged Play Store link.
- Backup reminder card; owner mobile-number prompt and Settings entry.
- Play Store link in the salary-slip PDF footer; in-app review request after sharing a
  salary slip.

### Changed
- Redesigned Home and attendance marking (P / A / ½ chips, today summary, bulk actions).
- Whole app translated: screen titles, buttons, reminders in all 10 languages.
- Faster app start; the splash no longer remounts the tree.

### Fixed
- Production builds now come from EAS and are signed with the EAS upload key; local
  Gradle bundles are rejected by Play (documented in `RELEASE.md`).
- Sentry source-map upload disabled on EAS builds until Sentry is configured.

## 1.0.4 — 2026-06-26

### Fixed
- Contact import, staff phone-number uniqueness, backup/restore, AI summary.
- Patched `expo-contacts` to stop a `SecurityException` crash when picking a contact
  without permission (2026-07-06 hotfix).

### Changed
- Unified button UI; segmented toggles render as two solid buttons.

## 1.0.3 and earlier — 2026-03-16 → 2026-06-24

Reconstructed from git history; exact version-to-commit mapping was not recorded.

- 2026-06-24 — AI monthly summary (Gemini through the Cloudflare Worker in `ai-proxy/`),
  contact picker for staff, salary-calculation updates.
- 2026-06-20 — Language settings, UI updates, Play Store release preparation.
- 2026-03-16 — Initial release: businesses, staff, attendance, salary, payments,
  advances, cashbook, PDF reports, file backup/restore, privacy policy.
