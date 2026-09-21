import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, Linking } from 'react-native';
import Constants from 'expo-constants';
import { List, Switch, Text, Divider } from 'react-native-paper';
import { getLanguageLabel } from '@/src/components/settings/LanguagePicker';
import { BackupRestore } from '@/src/components/settings/BackupRestore';
import { OwnerPhoneDialog } from '@/src/components/settings/OwnerPhoneDialog';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { useBusinessStore } from '@/src/stores/useBusinessStore';
import { colors } from '@/src/theme/colors';
import { scheduleAttendanceReminder, cancelAttendanceReminder, requestNotificationPermissions } from '@/src/utils/notifications';
import { router } from 'expo-router';
import i18n from '@/src/i18n';
import { track } from '@/src/utils/analytics';
import { shareApp } from '@/src/utils/shareApp';
import { PACKAGE } from '@/src/config/links';

export default function SettingsScreen() {
  const { language, reminderEnabled, setReminderEnabled, reminderTime, ownerPhone } = useSettingsStore();
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);

  const handleReminderToggle = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestNotificationPermissions();
      if (!granted) return;
      const [h, m] = reminderTime.split(':').map(Number);
      await scheduleAttendanceReminder(h, m);
    } else {
      await cancelAttendanceReminder();
    }
    await setReminderEnabled(enabled);
  };

  const handleRate = async () => {
    track('rate_app_tapped');
    const market = `market://details?id=${PACKAGE}`;
    const web = `https://play.google.com/store/apps/details?id=${PACKAGE}`;
    try {
      const canOpenStore = await Linking.canOpenURL(market);
      await Linking.openURL(canOpenStore ? market : web);
    } catch {
      Linking.openURL(web).catch(() => {});
    }
  };

  return (
    <ScrollView style={styles.container}>
      <List.Section>
        <List.Subheader>{i18n.t('business.section_title')}</List.Subheader>
        <List.Item
          title={useBusinessStore.getState().activeBusiness?.name || 'Hisab Pagar'}
          description={i18n.t('business.switch_description')}
          left={props => <List.Icon {...props} icon="domain" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => router.push('/business/select')}
        />
        <List.Item
          title={i18n.t('settings.owner_phone')}
          description={ownerPhone || i18n.t('settings.owner_phone_add')}
          left={props => <List.Icon {...props} icon="phone" />}
          right={props => <List.Icon {...props} icon="pencil" />}
          onPress={() => setShowPhoneDialog(true)}
        />
      </List.Section>

      <Divider />

      <List.Section>
        <List.Subheader>{i18n.t('settings.language')}</List.Subheader>
        <List.Item
          title={i18n.t('settings.language')}
          description={getLanguageLabel(language)}
          left={props => <List.Icon {...props} icon="translate" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => router.push('/settings/language')}
        />
      </List.Section>

      <Divider />

      <List.Section>
        <List.Subheader>{i18n.t('settings.attendance_reminder')}</List.Subheader>
        <List.Item
          title={i18n.t('settings.attendance_reminder')}
          description={reminderEnabled ? `${i18n.t('settings.reminder_time')}: ${reminderTime}` : undefined}
          right={() => (
            <Switch value={reminderEnabled} onValueChange={handleReminderToggle} color={colors.primary} />
          )}
        />
      </List.Section>

      <Divider />

      <List.Section>
        <List.Subheader>{i18n.t('settings.backup')}</List.Subheader>
        <BackupRestore />
      </List.Section>

      <Divider />

      <List.Section>
        <List.Subheader>{i18n.t('settings.about')}</List.Subheader>
        <List.Item
          title={i18n.t('settings.rate')}
          description={i18n.t('settings.rate_desc')}
          left={props => <List.Icon {...props} icon="star" color={colors.warning} />}
          right={props => <List.Icon {...props} icon="open-in-new" />}
          onPress={handleRate}
        />
        <List.Item
          title={i18n.t('settings.share_app')}
          description={i18n.t('settings.share_app_desc')}
          left={props => <List.Icon {...props} icon="share-variant" color={colors.primary} />}
          onPress={() => shareApp('settings')}
        />
        <Divider />
        <List.Item
          title={i18n.t('settings.version')}
          description={Constants.expoConfig?.version || '1.0.1'}
        />
      </List.Section>
      <OwnerPhoneDialog visible={showPhoneDialog} onDismiss={() => setShowPhoneDialog(false)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});
