import React, { useState } from 'react';
import { Platform } from 'react-native';
import { Portal, Dialog, Text, Button } from 'react-native-paper';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { useStaffStore } from '@/src/stores/useStaffStore';
import { setAppCheckEnabled } from '@/src/utils/installedApps';
import i18n from '@/src/i18n';

/**
 * One-time consent before checking which known apps (WhatsApp, UPI apps, other
 * khata/payroll apps) are installed. Play treats installed-app data as sensitive,
 * so nothing is checked until the owner taps Allow. Shown once, after the owner
 * has added staff, so it doesn't pile onto onboarding.
 */
export function AppCheckConsentDialog() {
  const { isOnboarded, appCheckConsent } = useSettingsStore();
  const hasStaff = useStaffStore((s) => s.staffList.length > 0);
  const [closing, setClosing] = useState(false);

  const visible = Platform.OS === 'android' && isOnboarded && hasStaff && appCheckConsent === '' && !closing;
  if (!visible) return null;

  const answer = async (granted: boolean) => {
    setClosing(true);
    await setAppCheckEnabled(granted);
  };

  return (
    <Portal>
      <Dialog visible dismissable={false}>
        <Dialog.Title>{i18n.t('app_check.title')}</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium">{i18n.t('app_check.body')}</Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => answer(false)}>{i18n.t('app_check.deny')}</Button>
          <Button mode="contained" onPress={() => answer(true)}>{i18n.t('app_check.allow')}</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
