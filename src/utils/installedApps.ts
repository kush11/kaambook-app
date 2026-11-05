/**
 * Which well-known apps the owner also has — only with their consent.
 *
 * Checks a fixed list (no "all installed apps"; the package names are declared in
 * modules/installed-apps/android/src/main/AndroidManifest.xml) and records a yes/no
 * per app as PostHog person properties, e.g. has_okcredit: true. Disclosed in the
 * privacy policy and Play Console Data safety ("Installed apps").
 */
import { Platform } from 'react-native';
import dayjs from 'dayjs';
import { areInstalled } from '../../modules/installed-apps';
import { track, setUserProperties, unsetUserProperties } from './analytics';
import { useSettingsStore } from '../stores/useSettingsStore';

/** PostHog property suffix → Android package. Keep in sync with the module's <queries>. */
export const KNOWN_APPS: Record<string, string> = {
  okcredit: 'in.okcredit.merchant',
  khatabook: 'com.vaibhavkalpe.android.khatabook',
  vyapar: 'in.android.vyapar',
  pagarbook: 'com.gyantech.pagarbook',
  whatsapp: 'com.whatsapp',
  whatsapp_business: 'com.whatsapp.w4b',
  phonepe: 'com.phonepe.app',
  gpay: 'com.google.android.apps.nbu.paisa.user',
  paytm: 'net.one97.paytm',
};

const CHECK_EVERY_DAYS = 7;

/** Runs on app start; does nothing without consent or if checked in the last week. */
export async function maybeReportInstalledApps(): Promise<void> {
  if (Platform.OS !== 'android') return;
  const { appCheckConsent, appCheckAt, setSetting } = useSettingsStore.getState();
  if (appCheckConsent !== 'granted') return;
  if (appCheckAt && dayjs().diff(dayjs(appCheckAt), 'day') < CHECK_EVERY_DAYS) return;

  const result = areInstalled(Object.values(KNOWN_APPS));
  if (Object.keys(result).length === 0) return; // native module missing
  const props: Record<string, boolean> = {};
  for (const [name, pkg] of Object.entries(KNOWN_APPS)) props[`has_${name}`] = !!result[pkg];

  setUserProperties(props);
  track('installed_apps_checked', {
    ...props,
    competitor_count: ['okcredit', 'khatabook', 'vyapar', 'pagarbook'].filter((n) => props[`has_${n}`]).length,
  });
  await setSetting('app_check_at', new Date().toISOString());
  useSettingsStore.setState({ appCheckAt: new Date().toISOString() });
}

/**
 * Consent from the Home dialog or the Settings switch. Turning it on checks right
 * away; turning it off stops the weekly check and removes the has_* properties
 * from the owner's PostHog person.
 */
export async function setAppCheckEnabled(enabled: boolean): Promise<void> {
  const store = useSettingsStore.getState();
  await store.setAppCheckConsent(enabled);
  if (enabled) {
    await store.setSetting('app_check_at', '');
    useSettingsStore.setState({ appCheckAt: '' });
    await maybeReportInstalledApps();
  } else {
    unsetUserProperties(Object.keys(KNOWN_APPS).map((name) => `has_${name}`));
  }
}
