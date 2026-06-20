# Hisab Pagar — Android Release Guide

How to build a signed, Play-Store-ready Android bundle **locally** (no EAS).

- **Package:** `com.hisabpagar.app`
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

- Current keystore password is weak (`password@123`). Since the app hasn't shipped
  yet, regenerate the keystore with a strong password before first publish — it's
  free to redo now, impossible later.
- For automated submission you could later add a Play service-account key
  (`play-store-key.json`) and use `eas submit`, but manual upload works fine.
