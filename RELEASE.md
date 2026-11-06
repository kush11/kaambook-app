# Hisab Pagar — Android Release Guide

> **Production builds are made on GitHub Actions** (since 1.0.9, 2026-11-06).
> Play's registered **upload key is the EAS-managed keystore** (SHA-1 `85:C4:16:FF:…:DB:27:B0`).
> GitHub Actions signs with that same keystore (stored as repo secrets). The local
> `android/app/hisabpagar-upload.keystore` (SHA-1 `E9:F4:…:81:35`) is **not** Play's upload key —
> Play rejects bundles signed with it; use it only for test APKs to sideload on a phone.

## Releasing (the normal path)

`.github/workflows/release-android.yml` builds, signs and uploads to the **Internal testing**
track whenever a `v*` tag is pushed. **Merging to master does not release anything.**

1. Bump `"version"` in `app.json` (e.g. `1.0.9` → `1.0.10`), add a CHANGELOG entry, merge to master.
2. Create the tag — either:
   - GitHub website (works from any device): **Releases → Draft a new release → Choose a tag →
     type `v1.0.10` → target `master` → Publish release**, or
   - terminal: `git tag v1.0.10 && git push origin v1.0.10`
3. ~20 min later the build is on **Play → Internal testing** (watch it at
   https://github.com/kush11/kaambook-app/actions). The R8 `mapping.txt` is uploaded with it,
   and a **GitHub Release** is created for the tag with the notes from that version's
   CHANGELOG section (`scripts/release-notes.sh`), so write the CHANGELOG first.
4. Test it from the Internal testing track, then **Play Console → Internal testing → Promote
   release → Production** and paste the release notes from `docs/release-<version>.md`.

Rules the workflow enforces:
- The tag must equal `v` + `app.json` version, or the run stops before building.
- **versionCode = major×10000 + minor×100 + patch** (1.0.9 → 10009, 1.0.10 → 10010). Play refuses
  a versionCode it has seen, so every release needs a new version. To re-release the same
  version, run the workflow by hand (Actions → Release Android → Run workflow) with a
  `version_code` override.
- The bundle must be signed with the upload key, not the debug key (checked before upload).

### What is stored where (no secrets in this repo)

| What | Where |
|---|---|
| Upload keystore + passwords + alias | GitHub repo secrets `ANDROID_UPLOAD_KEYSTORE_BASE64`, `ANDROID_UPLOAD_KEYSTORE_PASSWORD`, `ANDROID_UPLOAD_KEY_ALIAS`, `ANDROID_UPLOAD_KEY_PASSWORD`; master copy on EAS (expo.dev → kaambook-app → Credentials → Android → production); offline backup: password-protected zip `hisabpagar-play-upload-key.zip` in Kush's **personal** Google Drive (zip password with Kush) |
| Play service account key (`play-console-service-account@kaambook-app.iam.gserviceaccount.com`, key id `f68f1049…`) | GitHub secret `PLAY_SERVICE_ACCOUNT_JSON`; also EAS credentials (Submissions); Google Cloud project `kaambook-app` → IAM → Service accounts |
| Play permissions of that account | Play Console → Users and permissions: release to **testing tracks** only (no production — promote by hand). To publish straight to production, add *Release to production* there and change `track:` in the workflow |

### Recovering / rotating

- **Lost the GitHub secrets?** Download the keystore again: `npx eas-cli credentials -p android`
  → production → *credentials.json: Upload/Download…* → **Download credentials from EAS to
  credentials.json** (writes `credentials.json` + `credentials/android/keystore.jks`; both are
  gitignored), then:
  ```bash
  gh secret set ANDROID_UPLOAD_KEYSTORE_BASE64 -R kush11/kaambook-app --body "$(base64 -i credentials/android/keystore.jks)"
  gh secret set ANDROID_UPLOAD_KEYSTORE_PASSWORD -R kush11/kaambook-app --body "$(python3 -c "import json;print(json.load(open('credentials.json'))['android']['keystore']['keystorePassword'])")"
  gh secret set ANDROID_UPLOAD_KEY_ALIAS -R kush11/kaambook-app --body "$(python3 -c "import json;print(json.load(open('credentials.json'))['android']['keystore']['keyAlias'])")"
  gh secret set ANDROID_UPLOAD_KEY_PASSWORD -R kush11/kaambook-app --body "$(python3 -c "import json;print(json.load(open('credentials.json'))['android']['keystore']['keyPassword'])")"
  rm -r credentials credentials.json
  ```
  (`gh` must be logged in as **kush11**; Kush's office account `kushsingh11` can't see this repo.
  `gh auth switch -u kush11` / `gh auth switch -u kushsingh11`.)
- **Lost the upload key everywhere?** Play Console → Setup → App signing → *Request upload key
  reset* with a new keystore's certificate. App signing itself (Google-held) is unaffected.
- **Service account key revoked?** Google Cloud → kaambook-app → IAM → Service accounts →
  play-console-service-account → Keys → Add key (JSON) → `gh secret set PLAY_SERVICE_ACCOUNT_JSON -R kush11/kaambook-app < key.json`.

### CI workarounds (why the workflow has extra steps)

- `scripts/ci-stage-worklets.sh`: on a clean checkout Reanimated 4.1 can link before
  `libworklets.so` is where it expects; worklets is built first and the `.so` staged.
- `scripts/ci-patch-gradle.py`: `expo prebuild` makes release builds use the debug key; this
  points them at the upload key from environment variables. It also sets
  `ndk.debugSymbolLevel 'SYMBOL_TABLE'`, so the bundle carries native debug symbols and Play
  can symbolicate native crashes/ANRs (no separate symbols upload needed).

### QA build next to the Play app (for testing before a release)

`android/` is generated and git-ignored. After `npx expo prebuild -p android`, add this inside
`buildTypes { release { … } }` of `android/app/build.gradle`:

```gradle
// ./gradlew assembleRelease -PqaSuffix → com.kaambook.app.qa, installs next to the Play app.
if (project.hasProperty('qaSuffix')) {
    applicationIdSuffix '.qa'
    signingConfig signingConfigs.debug
}
```

Then `cd android && ./gradlew assembleRelease -PqaSuffix && adb install -r app/build/outputs/apk/release/app-release.apk`.
Google Drive sign-in won't work in this build (only Play-installed builds can sign in).

### EAS (fallback, manual only)

`.eas/workflows/release-android.yml` no longer runs on tags (the free tier queues ~20 min).
Run it by hand with `eas workflow:run release-android.yml`. Its remote versionCode counter is
behind GitHub's numbering, so first run `eas build:version:set -p android` and set it above the
last GitHub versionCode.

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
