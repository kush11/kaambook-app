# Hisab Pagar 1.0.9 — release sheet

- **Version:** 1.0.9 · versionCode 10009
- **Release:** tag `v1.0.9` → GitHub Actions run `42119000160` → Play Internal testing → promote by hand
  (first GitHub Actions release; EAS run `01a1ada1` was cancelled in the free-tier queue. Attempt 1
  failed on the worklets staging step, attempt 2 on signing with the local keystore instead of
  Play's EAS upload key; re-run with the EAS keystore.)
- **Why:** PostHog (Oct 19 – Nov 5) showed every user who connected Google Drive got
  `Drive 403: Request had insufficient authentication scopes` (3 users, 40 errors): Google's
  consent screen lets people untick the Drive box and still sign in. Play Console flagged
  code obfuscation at 1% (must reach 25% by Feb 2027). Plus the Oct 19 device-test fixes.

## What changed
- `googleDrive.ts`: after sign-in, the granted `scope` must include `drive.appdata`; if not,
  the grant is revoked and an alert ("Allow Google Drive access") offers **Try again**, which
  reopens Google's sheet and resumes the caller's backup/restore. A stored grant that answers
  403 for scopes is dropped (`drive_scope_lost`) so Home/Settings ask to connect again.
  Events: `drive_scope_denied`, `drive_scope_retry`, `drive_scope_lost`.
- R8 minify + resource shrinking on release (`expo-build-properties` in `app.json`).
- Home empty states for all-inactive staff and empty search; staff form Save above the
  gesture bar; EmptyState text full width (Devanagari last-word clipping).
- Oct 19 device-test fixes: joining date, inactive staff section, calendar date picker,
  back-dated payments/cashbook, delete confirmations, keyboard over dialogs (Android 15+),
  reminder time picker, Drive storage + change account.

## Tested before tagging
Minified release build (`.qa` package, debug-signed) on Xiaomi 24094RAD4I, 2026-11-06:
onboarding, add staff with back-dated joining date, attendance (P, back-filled half day +
overtime), back-dated advance, delete with confirm (payment + cashbook), keyboard over
cashbook sheet, reminder time (alarm set), Salary Due, PDF report + share sheet, mark
inactive, Hindi UI. No crashes or JS errors in logcat. Scope helpers unit-tested against
Google's real 403 bodies (scope vs storage-full).

**Not tested:** real Google sign-in (QA build can't use the Play-signed OAuth client).

## Verify on Internal testing (before promoting)
- Settings → Connect Google Drive → **untick** the Drive box → Continue → alert "Allow Google
  Drive access" → Try again → tick it → back in app, connected, "Backup saved".
- Settings → Connect Google Drive normally → backup saved, storage shows.
- PostHog: `drive_scope_denied` / `drive_scope_retry` arrive; no new `error_occurred`
  with "insufficient authentication scopes".
- Smoke test the R8 build: add staff, attendance, payment, PDF report, Drive backup.

## Play Console → Release notes

**en-IN / en-GB**
```
• Google Drive backup: if Drive permission was not given, the app now explains how to allow it and lets you try again
• Add a joining date for staff; days before it are not counted in salary
• Mark staff who left as inactive — their records stay safe
• Pick dates from a calendar; back-date payments and cashbook entries
• Choose your attendance reminder time
• Delete now asks for confirmation; bug fixes
```

**hi-IN**
```
• Google Drive बैकअप: अगर Drive की अनुमति नहीं दी गई थी, तो ऐप अब बताता है कैसे दें और दोबारा कोशिश करने देता है
• स्टाफ की जॉइनिंग डेट जोड़ें; उससे पहले के दिन वेतन में नहीं गिने जाते
• काम छोड़ चुके स्टाफ को निष्क्रिय करें — उनका रिकॉर्ड सुरक्षित रहता है
• कैलेंडर से तारीख चुनें; पुरानी तारीख का भुगतान और कैशबुक एंट्री जोड़ें
• हाज़िरी रिमाइंडर का समय चुनें
• डिलीट करने से पहले पुष्टि; बग सुधार
```

## Production
- Promoted from Internal testing to Production on 2026-11-06 04:31 IST, 100% rollout, all countries, release
  notes en-GB / en-IN / hi-IN. Sent for Google review; managed publishing is off, so it goes live
  as soon as review passes. Only warning: no native debug symbols uploaded (not blocking).
- Not yet verified on a Play-installed build: the Drive "untick the Drive box" flow.

## After promoting
- The R8 `mapping.txt` is uploaded by the workflow; check the obfuscation warning clears on
  the release dashboard.
