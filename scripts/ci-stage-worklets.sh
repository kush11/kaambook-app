#!/usr/bin/env bash
# CI only. Reanimated 4.1's CMake links against
#   react-native-worklets/android/build/intermediates/cmake/release/obj/<abi>/libworklets.so
# but on a clean checkout nothing puts it there before Reanimated builds
# ("missing and no known rule to make it"). Local builds hide this because the
# file is left over from earlier builds. Run after
# `./gradlew :react-native-worklets:assembleRelease`, before bundleRelease.
set -euo pipefail
W="$(node -p "require('path').dirname(require.resolve('react-native-worklets/package.json'))")/android/build/intermediates"
found=0
for so in "$W"/cxx/RelWithDebInfo/*/obj/*/libworklets.so; do
  [ -f "$so" ] || continue
  abi="$(basename "$(dirname "$so")")"
  mkdir -p "$W/cmake/release/obj/$abi"
  cp "$so" "$W/cmake/release/obj/$abi/"
  echo "staged libworklets.so for $abi"
  found=1
done
[ "$found" = 1 ] || { echo "libworklets.so not found under $W/cxx" >&2; exit 1; }
