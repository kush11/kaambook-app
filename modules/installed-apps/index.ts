import { requireOptionalNativeModule } from 'expo-modules-core';

type InstalledAppsNative = { areInstalled(packages: string[]): Record<string, boolean> };

// Optional: undefined on iOS/web or in a build without the native module.
const native = requireOptionalNativeModule<InstalledAppsNative>('InstalledApps');

/** package name → installed? Empty object when the native module is unavailable. */
export function areInstalled(packages: string[]): Record<string, boolean> {
  try {
    return native ? native.areInstalled(packages) : {};
  } catch {
    return {};
  }
}
