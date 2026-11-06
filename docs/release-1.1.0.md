# Hisab Pagar 1.1.0 — release sheet

- **Version:** 1.1.0 · versionCode 10100 (major×10000 + minor×100 + patch)
- **Release:** tag `v1.1.0` → GitHub Actions → Play Internal testing (2026-11-06)
- **Production:** not yet — promote by hand after the checks below
- **Why:** 12 of 18 users used the app on one day only (PostHog, Oct 19–Nov 5) even though all
  had the reminder on; competitors (PagarBook, SalaryBook) offer hourly pay, late fines and a
  monthly register; owners asked for dark mode / a cleaner Settings; 1.0.9 could rotate to
  landscape after reopening.

## What changed
- **Hourly salary** — pay per hour, working hours per day, hours editable per day.
- **Late fines** — per-staff fine per late day, Late toggle in the attendance sheet, shown on the
  staff page, Salary Due and the slip.
- **Monthly register PDF** — Salary Due → Monthly register: day-by-day attendance + salary table.
- **Dark mode** — Settings → Theme (Same as phone / Light / Dark).
- **Settings redesigned** — grouped cards, Backup & restore and Privacy pages, centred version.
- **Day-1 retention** — getting-started checklist (first week), personalised rolling reminders
  (named staff, day-2 text, skip days already marked), Drive card from day 2.
- **Installed-app check** (Android, with consent) — `has_*` person properties in PostHog.
- **Fixes** — portrait lock lost after Back + reopen; person properties dropped for owners
  without a phone number; R8 broke scheduling notifications with data.
- New analytics: `checklist_*`, `notification_opened`, `notif_permission`, `register_shared`,
  `installed_apps_checked`, `app_check_consent`, `theme_changed`; `attendance_marked` gains
  `late`, `has_hours`.

## Tested before tagging
Xiaomi (Android 15/HyperOS), QA build `com.kaambook.app.qa`, 2026-11-06:
- Hourly staff (₹100/h, 8 h) — 10 h present + late, half day yesterday → 14 h, −₹50, ₹1,350 ✅
- Monthly ₹12,000 present + late with no fine → ₹400, no deduction ✅; Salary Due total ₹1,750 ✅
- Register PDF generated and share sheet opened (layout checked on Mac with sample data)
- Dark / light / Hindi on Home, Salary Due, Cashbook, staff page, calendar, Settings pages
- Reminders: 7 scheduled at 8 PM, today's dropped after marking; checklist ticks
- App check consent → PostHog `has_*` correct; switch off → `$unset`
- Back + reopen stays portrait
- `npx tsx scripts/verify-salary.ts` 21/21; `npx tsc --noEmit` clean
- Not tested: Google Drive sign-in (only Play builds), real reminder delivery at 8 PM.

## Before promoting to Production
- [x] **Data safety: App activity → "Installed apps"** — collected, not shared, not ephemeral,
      optional (users can choose), purpose Analytics. Saved and sent for Google review 2026-11-06 ~09:50 IST.

## Verify on Internal testing
1. Update from the Internal testing link; app opens on existing data (migration adds columns).
2. Add an hourly staff member, mark a day with hours + Late → staff page shows hours and fine.
3. Salary Due → Monthly register → PDF opens.
4. Settings → Theme → Dark and back; Privacy page opens; Backup & restore → Google Drive connect.
5. Smoke test: attendance → payment → PDF slip.
6. PostHog: `theme_changed`, `register_shared`, `attendance_marked` with `late`.

## Play Console → Release notes

**en-IN / en-GB**
```
• Dark mode – choose it in Settings → Theme
• Hourly salary for staff paid by the hour
• Late fine: mark staff late and the fine is cut automatically
• Monthly register PDF of attendance and salary for all staff
• Getting started guide and smarter daily reminders
• Simpler, cleaner Settings
• Bug fixes and improvements
```

**hi-IN**
```
• डार्क मोड – सेटिंग्स → थीम में चुनें
• घंटे के हिसाब से वेतन वाले स्टाफ के लिए प्रति घंटा सैलरी
• लेट फ़ाइन: स्टाफ को लेट मार्क करें, फ़ाइन अपने-आप कटेगा
• सभी स्टाफ की हाज़िरी और सैलरी का मासिक रजिस्टर PDF
• शुरुआत गाइड और बेहतर रोज़ का रिमाइंडर
• आसान और साफ़ सेटिंग्स
• बग सुधार और बेहतर अनुभव
```

## After release
- Day 1 / day 3: PostHog `error_occurred` on 1.1.0; `notification_opened` count; D1 retention of
  new users vs 1.0.9; Play vitals.
