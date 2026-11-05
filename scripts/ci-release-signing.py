#!/usr/bin/env python3
"""CI only. `expo prebuild` generates android/app/build.gradle with release builds
signed by the debug key (and that wins over -Pandroid.injected.signing.*).
Point release at an upload-key config read from environment variables:
UPLOAD_STORE_FILE, UPLOAD_STORE_PASSWORD, UPLOAD_KEY_ALIAS, UPLOAD_KEY_PASSWORD."""
import pathlib, sys

path = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "android/app/build.gradle")
s = path.read_text()

debug_cfg = "    signingConfigs {\n        debug {"
upload_cfg = """    signingConfigs {
        upload {
            storeFile file(System.getenv('UPLOAD_STORE_FILE'))
            storePassword System.getenv('UPLOAD_STORE_PASSWORD')
            keyAlias System.getenv('UPLOAD_KEY_ALIAS')
            keyPassword System.getenv('UPLOAD_KEY_PASSWORD')
        }
        debug {"""
release_old = """        release {
            // Caution! In production, you need to generate your own keystore file.
            // see https://reactnative.dev/docs/signed-apk-android.
            signingConfig signingConfigs.debug"""
release_new = """        release {
            signingConfig signingConfigs.upload"""

for old in (debug_cfg, release_old):
    if s.count(old) != 1:
        sys.exit(f"ci-release-signing: expected block not found once in {path}:\n{old}")
s = s.replace(debug_cfg, upload_cfg).replace(release_old, release_new)
path.write_text(s)
print(f"ci-release-signing: release builds in {path} now use the upload key")
