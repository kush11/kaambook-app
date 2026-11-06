# Release checklist — Hisab Pagar (Android)

Follow this top to bottom for every Play release. Copy it into the release PR or tick it
in your head; skipping a step is how a bad build reaches users.

## 1. Decide the version

- [ ] Pick the next version: bug fixes → patch (`1.0.9` → `1.0.10`); new features → minor
      (`1.0.x` → `1.1.0`). Never reuse a version: Play rejects a versionCode it has seen
      (versionCode = major×10000 + minor×100 + patch, e.g. 1.1.0 → 10100).
- [ ] Everything going out is merged to `master`.

## 2. Check the code (on your Mac)

- [ ] `yarn install` then `npx tsc --noEmit` — no type errors.
- [ ] `npx tsx scripts/verify-salary.ts` — salary maths still correct.
- [ ] New UI text exists in **all 10** `src/i18n/*.json` files (en, hi, bn, gu, kn, mr, od, pa, ta, te).
- [ ] `src/config/telemetry.ts` still has the real PostHog key (it is sometimes blanked for
      QA builds — a blank key ships a release with no analytics).
- [ ] New permissions, data collected or third-party services? Update
      `docs/privacy-policy.html` **and** Play Console → App content → Data safety.

## 3. Test on a real phone before tagging

Build the minified release as a separate app so it installs next to the Play version:

```bash
cd android && ./gradlew assembleRelease -PqaSuffix && adb install -r app/build/outputs/apk/release/app-release.apk
```

(`-PqaSuffix` → package `com.kaambook.app.qa`, debug-signed; the `android/` folder is local —
regenerate with `npx expo prebuild -p android` if it is missing, then re-add the `qaSuffix`
block from RELEASE.md.)

- [ ] Onboarding → add staff → mark attendance → add payment/advance → Salary Due is right.
- [ ] PDF report opens the share sheet. Cashbook add/delete. Settings screens open.
- [ ] Whatever this release changed, tested on purpose.
- [ ] Switch to Hindi once — no cut-off or missing text.
- [ ] `adb logcat | grep -E "FATAL EXCEPTION|E ReactNativeJS"` stays empty.
- Google Drive sign-in **cannot** be tested here (only Play-installed builds can sign in) — test it in step 6.

## 4. Write it down

- [ ] `cp docs/release-template.md docs/release-<version>.md` and fill it in: what changed,
      why, what you tested, what to check on Internal testing, Play release notes.
- [ ] `CHANGELOG.md`: add a row to the table and a section (Added / Fixed / Changed).
- [ ] Play "What's new" text ≤ 500 characters per language, plain bullets, no internal jargon.

## 5. Release

- [ ] Bump `"version"` in `app.json`, commit (`Release 1.0.10`), push/merge to `master`.
- [ ] Create the tag — it **must** equal `v` + the app.json version:
      - GitHub website: Releases → Draft a new release → Choose a tag → `v1.0.10` (create) →
        target `master` → title `1.0.10` → paste the release sheet → Publish, **or**
      - terminal: `git tag -a v1.0.10 -m "1.0.10" && git push origin v1.0.10`
- [ ] Watch https://github.com/kush11/kaambook-app/actions → *Release Android* (~20 min).
      Green = bundle + mapping uploaded to **Internal testing**, and the GitHub Release for the
      tag created from the CHANGELOG section (check https://github.com/kush11/kaambook-app/releases).
      If it fails, open the failed step's log; common causes are in RELEASE.md.

## 6. Verify on Internal testing

- [ ] On your phone, update from the Play Internal testing link (Play Console → Internal
      testing → Testers → copy link).
- [ ] Run the "Verify on Internal testing" list from the release sheet — including Google
      Drive connect/backup, which only works on Play-installed builds.
- [ ] Play Console → the release → no pre-launch report crashes.

## 7. Promote to Production

- [ ] Play Console → Test and release → Internal testing → **Promote release → Production**.
- [ ] Paste the release notes (en-IN, en-GB, hi-IN from the release sheet).
- [ ] Rollout: 100% for small fixes; for risky changes start at 20% and raise after 2 days.
- [ ] Send for review. Review usually takes a few hours to 2 days.

## 8. After release

- [ ] `CHANGELOG.md` status → *Production (date)*; note the versionCode and GitHub run id in the release sheet.
- [ ] Day 1 and day 3: PostHog — `error_occurred` for the new `$app_version`; Play Console →
      Android vitals → crashes/ANRs; Ratings & reviews.
- [ ] Anything broken: fix → new patch version → start again at step 1 (Play cannot roll back;
      you can only halt a staged rollout and ship a higher version).
