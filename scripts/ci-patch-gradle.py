#!/usr/bin/env python3
"""CI only. Patches the android/app/build.gradle that `expo prebuild` generates:

1. Signing: prebuild signs release builds with the debug key (and that wins over
   -Pandroid.injected.signing.*). Point release at an upload-key config read from
   environment variables: UPLOAD_STORE_FILE, UPLOAD_STORE_PASSWORD, UPLOAD_KEY_ALIAS,
   UPLOAD_KEY_PASSWORD.
2. Native debug symbols: set ndk.debugSymbolLevel so the .aab carries the symbol
   tables of every .so (BUNDLE-METADATA/com.android.tools.build.debugsymbols). Play
   reads them from the bundle, so crashes/ANRs in native code are symbolicated and
   the "you've not uploaded debug symbols" warning goes away."""
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

default_cfg = "    defaultConfig {\n"
default_new = """    defaultConfig {
        ndk {
            debugSymbolLevel 'SYMBOL_TABLE'
        }
"""

for old in (debug_cfg, release_old, default_cfg):
    if s.count(old) != 1:
        sys.exit(f"ci-patch-gradle: expected block not found once in {path}:\n{old}")
s = s.replace(debug_cfg, upload_cfg).replace(release_old, release_new).replace(default_cfg, default_new)
path.write_text(s)
print(f"ci-patch-gradle: {path}: release signed with the upload key, native debug symbols in the bundle")
