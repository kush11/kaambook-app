/**
 * Phones stay portrait; tablets, foldables and Chromebooks may rotate.
 *
 * app.json no longer locks orientation ("default"): Play flags manifest
 * orientation locks as bad for large screens, and Android 16+ ignores them on
 * screens >= 600dp anyway. The layouts are built for a portrait phone, so on
 * phone-sized screens we lock portrait here instead.
 *
 * The lock belongs to the Android activity, not the app process. When the owner
 * leaves with Back and reopens the app, Android can create a new activity while
 * the JS keeps running, so the startup lock is gone and the screen rotates.
 * Re-apply it every time the app comes to the foreground.
 */
import { AppState, Dimensions, Platform } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';

/** Android's large-screen threshold: smallest width of 600dp. */
const LARGE_SCREEN_MIN_DP = 600;

export function isPhoneSizedScreen(): boolean {
  const { width, height } = Dimensions.get('screen');
  return Math.min(width, height) < LARGE_SCREEN_MIN_DP;
}

function applyLock(): void {
  if (!isPhoneSizedScreen()) return;
  ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {
    // Never block startup over orientation.
  });
}

let listening = false;

export function lockPortraitOnPhones(): void {
  if (Platform.OS === 'web') return;
  applyLock();
  if (listening) return;
  listening = true;
  AppState.addEventListener('change', (state) => {
    if (state === 'active') applyLock();
  });
}
