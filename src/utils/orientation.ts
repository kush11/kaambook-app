/**
 * Phones stay portrait; tablets, foldables and Chromebooks may rotate.
 *
 * app.json no longer locks orientation ("default"): Play flags manifest
 * orientation locks as bad for large screens, and Android 16+ ignores them on
 * screens >= 600dp anyway. The layouts are built for a portrait phone, so on
 * phone-sized screens we lock portrait here instead, at startup.
 */
import { Dimensions, Platform } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';

/** Android's large-screen threshold: smallest width of 600dp. */
const LARGE_SCREEN_MIN_DP = 600;

export function isPhoneSizedScreen(): boolean {
  const { width, height } = Dimensions.get('screen');
  return Math.min(width, height) < LARGE_SCREEN_MIN_DP;
}

export function lockPortraitOnPhones(): void {
  if (Platform.OS === 'web' || !isPhoneSizedScreen()) return;
  ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {
    // Never block startup over orientation.
  });
}
