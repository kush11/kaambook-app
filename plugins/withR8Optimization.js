/**
 * Turns on R8's optimised resource shrinking for release builds.
 *
 * Play Console (Android vitals, Nov 2026) flagged 1.0.9 for memory/performance:
 *   1. "Optimised resource shrinking isn't enabled"  -> fixed here (android.r8.optimizedResourceShrinking)
 *   2. "Optimisation isn't enabled"                    -> deliberately NOT enabled, see below
 *   3. "Upgrade your Android Gradle plug-in to 9.0+"   -> needs a newer Expo SDK / React Native (RN 0.81 pins AGP 8.11)
 *
 * Why not proguard-android-optimize.txt: tried on 2026-11-06 with Expo SDK 54 / RN 0.81 — the
 * release build stuck on the splash screen forever (JS init never finished, no error logged).
 * Re-test it after the next Expo SDK upgrade; until then a working app beats a smaller one.
 *
 * Runs at prebuild, so local and GitHub Actions builds get the same setup.
 */
const { withGradleProperties } = require('@expo/config-plugins');

module.exports = function withR8Optimization(config) {
  return withGradleProperties(config, (cfg) => {
    const key = 'android.r8.optimizedResourceShrinking';
    cfg.modResults = cfg.modResults.filter((p) => !(p.type === 'property' && p.key === key));
    cfg.modResults.push({ type: 'property', key, value: 'true' });
    return cfg;
  });
};
