# Hisab Pagar — Android Release Guide

> **Production builds are made on Expo (EAS), not locally.**
> Every Play upload so far (versionCode 6 onwards) was built with
> `eas build --platform android --profile production`, and Play has the **EAS-managed key**
> registered as the upload key (SHA-1 `85:C4:16:FF:…:27:B0`). EAS also auto-increments the versionCode.
> The local Gradle build described below is signed with a different keystore, so Play
> **rejects** its bundles — use it only for test APKs to sideload on a phone.

## Automated release (EAS Workflows) — the normal path

`.eas/workflows/release-android.yml` builds and submits to the **Internal testing** track
whenever a `v*` tag is pushed. Nothing runs on merges to master.

```bash
# 1. bump "version" in app.json, commit, merge to master
# 2. tag the release
git tag v1.0.7
git push origin v1.0.7
# 3. ~15 min later the build is on Play → Internal testing
# 4. Play Console → Internal testing → Promote release → Production, paste release notes
```

- Watch runs at https://expo.dev/accounts/kush636/projects/kaambook-app/workflows
- Run it without a tag: `eas workflow:run release-android.yml`
- Release notes are **not** set by EAS submit; paste them from `docs/release-<version>.md`.

### One-time setup (done 2026-09-28 unless marked TODO)

- Google Service Account key (`play-console-service-account@kaambook-app.iam.gserviceaccount.com`)
  uploaded to EAS credentials and assigned to `com.kaambook.app` for submissions. The JSON
  is **not** in the repo; a copy lives in `~/Downloads/kaambook-app-f68f1049fadc.json`.
- `eas.json` → `submit.production.android` uses the EAS-stored key, track `internal`.
- Play Console → Users and permissions: the service account is an Active user on
  *Hisab Pagar* with **Release apps to testing tracks**, **Manage testing tracks and edit
  tester lists** and **View app information** (done 2026-09-28). It deliberately does
  **not** have *Release to production*; promote by hand. If it ever needs to go straight
  to production, add that permission and change `track` in eas.json.
- **TODO (expo.dev):** project → Settings → GitHub → install the Expo GitHub app and link
  `kush11/kaambook-app`. Tag pushes only trigger the workflow after this.

---

## Local build (fallback / test APKs only)

How to build a signed, Play-Store-ready Android bundle **locally** (no EAS).

- **Package (applicationId):** `com.kaambook.app` — this is the app's identity on Play and must never change. (The Gradle `namespace` is `com.hisabpagar.app`; that is internal only.)
- **App name:** Hisab Pagar
- **Deep-link scheme:** `hisabpagar://`
- **Build output:** Android App Bundle (`.aab`)

---

## Prerequisites (one-time)

- **JDK 17** installed
- **Android SDK** (easiest via Android Studio)
- The upload keystore: `android/app/hisabpagar-upload.keystore` (already created)

> The entire `android/` folder is git-ignored and treated as generated.
> **Do not run `expo prebuild --clean`** — it would wipe the signing setup and the
> deep-link scheme change. Keep and build the existing `android/` folder as-is.

---

## Signing setup (already configured)

Release signing is wired in `android/app/build.gradle`. It reads credentials from
`android/gradle.properties`, which is git-ignored so the secrets stay on this machine:

```properties
HISABPAGAR_UPLOAD_STORE_FILE=hisabpagar-upload.keystore
HISABPAGAR_UPLOAD_KEY_ALIAS=hisabpagar
HISABPAGAR_UPLOAD_STORE_PASSWORD=********
HISABPAGAR_UPLOAD_KEY_PASSWORD=********
```

If the credentials are missing, the release build falls back to the debug keystore
(so nothing breaks during development, but that build is **not** Play-uploadable).

### Keystore details
- File: `android/app/hisabpagar-upload.keystore`
- Alias: `hisabpagar`
- Algorithm: RSA 2048, SHA256withRSA
- Valid until: 2053

> ⚠️ **Back up the keystore file and its password** in at least two safe places
> (e.g. a password manager + offline copy). If you lose them you can **never**
> publish an update to this app — you'd have to create a brand-new Play listing.

---

## Build a release bundle

```bash
cd /Users/kush/Project/kaambook-app/android
./gradlew bundleRelease
```

Output:
```
android/app/build/outputs/bundle/release/app-release.aab
```

Upload that `.aab` to **Play Console**.

### If Gradle picks the wrong Java version
```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
./gradlew bundleRelease
```

### Build a test APK instead (to sideload on a phone)
```bash
./gradlew assembleRelease
# -> android/app/build/outputs/apk/release/app-release.apk
```

### Clean rebuild (if something gets stuck)
```bash
./gradlew clean
./gradlew bundleRelease
```

---

## Versioning (do this before each new release)

Bump these in `android/app/build.gradle` → `defaultConfig`:

- `versionCode` — integer, **must increase** for every Play upload (1 → 2 → 3 …)
- `versionName` — user-visible string (e.g. `"1.0.1"`)

Keep `version` in `app.json` in sync with `versionName`.

---

## Verify a build is signed correctly

```bash
# Confirm the bundle is signed with your upload key
keytool -printcert -jarfile android/app/build/outputs/bundle/release/app-release.aab
```
The SHA-256 fingerprint should match your keystore:
```bash
keytool -list -v -keystore android/app/hisabpagar-upload.keystore -alias hisabpagar
```

---

## Pre-launch checklist

- [ ] `versionCode` increased since last upload
- [ ] Built with the **release** keystore (not debug)
- [ ] Privacy policy hosted at a public URL (source: `docs/privacy-policy.html`)
- [ ] Play Console listing filled in (source: `docs/play-store-listing.md`)
- [ ] Screenshots + feature graphic uploaded
- [ ] Data Safety form completed
- [ ] Content rating questionnaire done
- [ ] Keystore + password backed up safely

---

## Notes

- The app is live on Play, so the upload keystore can no longer be regenerated — but its
  **passwords can still be changed** without changing the key:
  `keytool -storepasswd -keystore android/app/hisabpagar-upload.keystore` and
  `keytool -keypasswd -alias hisabpagar -keystore android/app/hisabpagar-upload.keystore`,
  then update `android/gradle.properties`. Never write the password in this file or anywhere in git.
- Automated submission uses the Google Service Account key stored in EAS credentials
  (see "Automated release" above). Never commit the JSON key.
