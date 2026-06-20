import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { List, Switch, Text, Divider } from 'react-native-paper';
import { getLanguageLabel } from '@/src/components/settings/LanguagePicker';
import { BackupRestore } from '@/src/components/settings/BackupRestore';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { useBusinessStore } from '@/src/stores/useBusinessStore';
import { colors } from '@/src/theme/colors';
import { scheduleAttendanceReminder, cancelAttendanceReminder, requestNotificationPermissions } from '@/src/utils/notifications';
import { router } from 'expo-router';
import i18n from '@/src/i18n';

export default function SettingsScreen() {
  const { language, reminderEnabled, setReminderEnabled, reminderTime } = useSettingsStore();

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
        <List.Item title={i18n.t('settings.version')} description="1.0.0" />
      </List.Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});
