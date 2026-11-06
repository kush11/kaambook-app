# Changelog

All releases of Hisab Pagar (package `com.kaambook.app`). One entry per Play release,
newest first. Each entry links the detailed release sheet in `docs/` where one exists.
Version codes 6 and up were built on EAS; earlier ones were built locally.

| Version | versionCode | Date | EAS build | Play status |
|---|---|---|---|---|
| 1.1.0 | 10100 | 2026-11-06 | GitHub Actions (tag `v1.1.0`) | Internal testing — waiting for Data safety update before Production |
| 1.0.9 | 10009 | 2026-11-06 | GitHub Actions run `42119000160` (tag `v1.0.9`); EAS run `01a1ada1` cancelled in queue | **Production** — promoted 2026-11-06 04:31 IST, live on Google Play 05:16 IST, 100% rollout |
| 1.0.8 | 14 | 2026-09-28 | CI (tag `v1.0.8`) | **Production** (promoted from Internal testing 2026-10-11 21:28 IST, 100% rollout, in Play review) |
| 1.0.7 | 12 (13 CI) | 2026-09-28 | manual `0b179a4d` (vc 12); CI run `01a0e4ad` (vc 13) | Production 2026-09-28 → 2026-10-11 (vc 12, promoted by hand 03:10 IST; superseded by 1.0.8); vc 13 stayed on Internal testing |
| 1.0.6 | 11 | 2026-09-27 | `08fa496d` | Production (superseded) |
| 1.0.5 | 10 | 2026-09-21 | `b7ee5040` | Production (superseded) |
| 1.0.4 | 8, 9 | 2026-06-26 | — | Production (superseded) |
| ≤ 1.0.3 | 1–7 | 2026-03 → 2026-06 | — | superseded |

## 1.1.0 — 2026-11-06 · [release sheet](docs/release-1.1.0.md)

### Added
- **Hourly salary.** New salary type: pay per hour × hours worked. Each staff member has a
  "working hours per day" (default 8); present = that many hours, half day = half, paid leave =
  full shift; hours can be changed per day in the attendance sheet.
- **Late fines.** Per-staff "late fine per late day"; a Late toggle on present / half days in the
  attendance sheet; deducted automatically and shown on Salary Due, the staff page and the slip.
- **Monthly register PDF** from Salary Due: every staff member's day-by-day attendance (P / A / H /
  PL / UL / HO / WO, L = late) and the salary register (rate, days, hours, OT, late fine, earned,
  paid, balance, totals). Event `register_shared`.
- The attendance sheet now opens with the day's saved status, note and overtime filled in.
- **Dark mode.** Settings → Theme: Same as phone (default), Light, Dark. All screens use the
  theme (`src/theme/ThemeProvider.tsx`: `useColors()`, `makeStyles()`); PDF salary slips and the
  splash stay light.
- **Getting started checklist** on Home for the first week: mark attendance → record an advance
  → see Salary Due → come back tomorrow (shows the reminder time). Events `checklist_*`.
- **Personalised reminders.** The next 7 days are scheduled one by one, naming a staff member,
  with day-2 copy; today is skipped once everyone is marked, and days that are a week off for
  everyone are skipped. Rebuilt on app start, attendance and staff changes; they stop after a
  week without opening the app. `notification_opened` event, `notif_permission` person property.
- **Installed-app check** (with consent, Android): `has_*` person properties for OkCredit,
  Khatabook, Vyapar, PagarBook, WhatsApp (Business), PhonePe, Google Pay, Paytm. One-time
  dialog; switch in Settings → Privacy. **Declare "Installed apps" in Play Data safety first.**
- Native debug symbols in the bundle (Play can symbolicate native crashes).

### Changed
- **Settings redesigned:** grouped cards (Business, Preferences, Your data, Support), centred
  version footer, Backup & restore and Privacy moved to their own pages; the app-check row no
  longer lists app names.
- The Google Drive card on Home appears from the day after the first staff member is added
  (day one is for the checklist).
- Phones stay portrait; tablets and foldables can rotate (Play large-screen recommendation).

### Fixed
- **Phones could rotate to landscape** after leaving the app with Back and reopening it (Android
  made a new activity without the portrait lock while the app kept running; affects 1.0.9).
  The lock is now re-applied whenever the app comes to the foreground.
- Person properties (`staff_count`, `business_count`, `has_*`) were dropped by PostHog for
  owners who never entered a phone number; now set with `setPersonProperties`.
- R8 stripped expo-notifications' serialization code, so notifications with `data` could not
  be scheduled (keep rules in `app.json` → expo-build-properties).

## 1.0.9 — 2026-11-06 · [release sheet](docs/release-1.0.9.md)

### Fixed
- **Google Drive backup "403 insufficient authentication scopes".** Google's consent
  screen lets people untick the Drive box and still sign in; the app then said
  "Connected" and every backup failed (all 3 users who connected Drive between Oct 19 and
  Nov 5 hit it, 40 errors). Sign-in now checks the granted scopes, revokes a grant without
  Drive, and explains how to allow it with a "Try again" that resumes the backup/restore.
  An existing grant that answers 403 for scopes is dropped, so the app asks to connect again
  instead of failing every day. New events: `drive_scope_denied`, `drive_scope_retry`,
  `drive_scope_lost`.
- Edit staff now keeps the overtime rate and joining date; back-filled attendance before
  the joining date moves the joining date back.
- Payment and cashbook deletes ask for confirmation; delete icons have accessibility labels.
- Keyboard no longer covers dialogs and sheets on Android 15+.
- Home: when every staff member is inactive it says "No active staff" (not "No staff added
  yet"), and a search with no match says "No staff found". Add/Edit staff Save button no
  longer sits under the gesture bar.

### Added
- Joining date on the staff form; date fields open a calendar (future dates disabled).
- Back-dating for payments and cashbook entries.
- Inactive staff: hidden from the daily list, kept in a collapsible "Inactive staff" section.
- Attendance reminder time picker in Settings.
- Drive backup settings: storage used, change Google account, storage-full message.

### Changed
- Release builds are minified and obfuscated with R8 (`expo-build-properties`:
  `enableMinifyInReleaseBuilds`, `enableShrinkResourcesInReleaseBuilds`). Play flagged
  obfuscation at 1% (needs 25% by Feb 2027). Upload `mapping.txt` with the bundle so
  Play's crash stacks stay readable.

## 1.0.8 — 2026-09-28 · [release sheet](docs/release-1.0.8.md)

### Fixed
- Google Drive sign-in on a real phone: the OAuth redirect no longer shows "Unmatched
  Route", and a sign-in survives the app being killed while Google's sheet is open
  (state + PKCE verifier persisted, code exchanged on cold start).
- Google Cloud: Android OAuth client now has "Enable custom URI scheme" on, which the
  browser-based flow requires.

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
  the Internal testing track (`.eas/workflows/release-android.yml`). First run: tag
  `v1.0.7` → workflow run `01a0e4ad` → versionCode 13 on Internal testing. (Production got
  the manual versionCode 12 build instead, promoted by hand on 2026-09-28; see release sheet.)
- Website at https://kush11.github.io/kaambook-app/ (docs/index.html, 10 languages).

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
