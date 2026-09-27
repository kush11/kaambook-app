# Hisab Pagar 1.0.6 — release sheet

- **Version:** 1.0.6 (versionCode is auto-incremented by EAS; local Gradle says 11)
- **Bundle:** built on Expo (EAS), `eas build --platform android --profile production`
- **Signed with:** the EAS-managed upload key Play has on file (see `RELEASE.md`)

## Why this release

PostHog for 1.0.5 (21–27 Sept 2026, grouped by person): 9 real users, all 9 finished
onboarding, 8 added staff, only 4 ever marked attendance. The drop is between adding
staff and starting the daily habit, and the daily reminder was off by default.

## What changed

1. **Reminder turns on with the first staff.** Saving the first staff member asks for
   notification permission and schedules the 8:00 PM reminder (`autoEnableReminder`
   in `useSettingsStore`). Event: `reminder_auto_enabled { source, granted }`.
2. **"Mark today's attendance for <name>" card on Home** right after the first staff
   is added, with Present / Absent / Later. Hides once today is marked from anywhere.
   Event: `first_attendance_nudge { action: present | absent | later }`.
3. **In-app rating asks earlier.** The Play review sheet now triggers after 5 attendance
   marks across 2+ days (was 7 distinct days). Event unchanged: `review_requested`.
4. New strings under `first_attendance.*` in all 10 languages.

## Verify on Internal testing

- Fresh install → onboarding → add one staff → notification permission dialog appears →
  back on Home the card names the staff; tapping Present marks today and the card goes.
- Settings shows the Attendance Reminder toggle ON at 8:00 PM without touching it.
- Existing users (already have staff) see no card and no permission dialog.
- PostHog: `reminder_auto_enabled` and `first_attendance_nudge` arrive under 1.0.6.

## What's new (Play Console → Release notes)

**en-IN / en-US**
```
• Daily attendance reminder now switches on automatically when you add your first staff
• One-tap "Mark today's attendance" right after adding staff
• Small fixes
```

**hi-IN**
```
• पहला स्टाफ जोड़ते ही रोज़ का हाज़िरी रिमाइंडर अपने आप चालू
• स्टाफ जोड़ने के तुरंत बाद एक टैप में आज की हाज़िरी लगाएं
• छोटे सुधार
```
