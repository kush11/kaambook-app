import React, { useState } from 'react';
import { ScrollView, View, Linking } from 'react-native';
import Constants from 'expo-constants';
import dayjs from 'dayjs';
import { List, Switch, Text, Portal, Dialog, Chip, Button, RadioButton } from 'react-native-paper';
import { router } from 'expo-router';
import { getLanguageLabel } from '@/src/components/settings/LanguagePicker';
import { OwnerPhoneDialog } from '@/src/components/settings/OwnerPhoneDialog';
import { SettingsGroup } from '@/src/components/settings/SettingsGroup';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { useBusinessStore } from '@/src/stores/useBusinessStore';
import { makeStyles, useColors } from '@/src/theme';
import { scheduleAttendanceReminder, cancelAttendanceReminder, requestNotificationPermissions } from '@/src/utils/notifications';
import i18n from '@/src/i18n';
import { track } from '@/src/utils/analytics';
import { shareApp } from '@/src/utils/shareApp';
import { PACKAGE } from '@/src/config/links';

// Hourly choices for the daily reminder, 07:00 to 22:00.
const REMINDER_TIMES = Array.from({ length: 16 }, (_, i) => `${String(i + 7).padStart(2, '0')}:00`);
const THEME_MODES = ['system', 'light', 'dark'] as const;

const formatTime = (hhmm: string) => dayjs(`2000-01-01T${hhmm}`).format('h:mm A');

export default function SettingsScreen() {
  const styles = useStyles();
  const colors = useColors();
  const {
    language, reminderEnabled, setReminderEnabled, reminderTime, setReminderTime,
    ownerPhone, themeMode, setThemeMode, driveEmail,
  } = useSettingsStore();
  const businessName = useBusinessStore((s) => s.activeBusiness?.name) || 'Hisab Pagar';
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [showTimeDialog, setShowTimeDialog] = useState(false);
  const [showThemeDialog, setShowThemeDialog] = useState(false);

  const handleReminderTime = async (time: string) => {
    setShowTimeDialog(false);
    await setReminderTime(time);
    if (reminderEnabled) {
      const [h, m] = time.split(':').map(Number);
      await scheduleAttendanceReminder(h, m);
    }
  };

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

  const chevron = (props: { color: string }) => <List.Icon {...props} icon="chevron-right" />;
  const icon = (name: string) => (props: { color: string }) => <List.Icon {...props} icon={name} color={colors.primary} />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SettingsGroup title={i18n.t('business.section_title')}>
        <List.Item
          title={businessName}
          description={i18n.t('business.switch_description')}
          left={icon('domain')}
          right={chevron}
          onPress={() => router.push('/business/select')}
        />
        <List.Item
          title={i18n.t('settings.owner_phone')}
          description={ownerPhone || i18n.t('settings.owner_phone_add')}
          left={icon('phone-outline')}
          right={chevron}
          onPress={() => setShowPhoneDialog(true)}
        />
      </SettingsGroup>

      <SettingsGroup title={i18n.t('settings.preferences')}>
        <List.Item
          title={i18n.t('settings.language')}
          description={getLanguageLabel(language)}
          left={icon('translate')}
          right={chevron}
          onPress={() => router.push('/settings/language')}
        />
        <List.Item
          title={i18n.t('settings.daily_reminder')}
          description={reminderEnabled ? formatTime(reminderTime) : i18n.t('settings.reminder_off')}
          left={icon('bell-outline')}
          onPress={reminderEnabled ? () => setShowTimeDialog(true) : () => handleReminderToggle(true)}
          right={() => (
            <Switch value={reminderEnabled} onValueChange={handleReminderToggle} color={colors.primary} style={styles.switch} />
          )}
        />
        <List.Item
          title={i18n.t('settings.theme')}
          description={i18n.t(`settings.theme_${themeMode}`)}
          left={icon('theme-light-dark')}
          right={chevron}
          onPress={() => setShowThemeDialog(true)}
        />
      </SettingsGroup>

      <SettingsGroup title={i18n.t('settings.your_data')}>
        <List.Item
          title={i18n.t('settings.backup_restore')}
          description={driveEmail ? i18n.t('drive.on') : i18n.t('settings.backup_not_set')}
          descriptionStyle={driveEmail ? undefined : { color: colors.warning }}
          left={icon('cloud-upload-outline')}
          right={chevron}
          onPress={() => router.push('/settings/backup')}
        />
        <List.Item
          title={i18n.t('settings.privacy')}
          description={i18n.t('settings.privacy_desc')}
          left={icon('shield-lock-outline')}
          right={chevron}
          onPress={() => router.push('/settings/privacy')}
        />
      </SettingsGroup>

      <SettingsGroup title={i18n.t('settings.support')}>
        <List.Item
          title={i18n.t('settings.rate')}
          description={i18n.t('settings.rate_desc')}
          left={icon('star-outline')}
          right={(props) => <List.Icon {...props} icon="open-in-new" />}
          onPress={handleRate}
        />
        <List.Item
          title={i18n.t('settings.share_app')}
          description={i18n.t('settings.share_app_desc')}
          left={icon('share-variant-outline')}
          onPress={() => shareApp('settings')}
        />
      </SettingsGroup>

      <View style={styles.footer}>
        <Text variant="titleSmall" style={styles.footerName}>Hisab Pagar</Text>
        <Text variant="bodySmall" style={styles.footerVersion}>
          {i18n.t('settings.version_footer', { version: Constants.expoConfig?.version ?? '' })}
        </Text>
      </View>

      <OwnerPhoneDialog visible={showPhoneDialog} onDismiss={() => setShowPhoneDialog(false)} />
      <Portal>
        <Dialog visible={showTimeDialog} onDismiss={() => setShowTimeDialog(false)}>
          <Dialog.Title>{i18n.t('settings.reminder_time')}</Dialog.Title>
          <Dialog.Content style={styles.timeGrid}>
            {REMINDER_TIMES.map((t) => (
              <Chip
                key={t}
                selected={t === reminderTime}
                showSelectedCheck={false}
                onPress={() => handleReminderTime(t)}
                style={[styles.timeChip, t === reminderTime && styles.timeChipSelected]}
                textStyle={t === reminderTime ? styles.timeChipTextSelected : undefined}
              >
                {formatTime(t)}
              </Chip>
            ))}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowTimeDialog(false)}>{i18n.t('common.cancel')}</Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog visible={showThemeDialog} onDismiss={() => setShowThemeDialog(false)}>
          <Dialog.Title>{i18n.t('settings.theme')}</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group
              value={themeMode}
              onValueChange={(v) => {
                setShowThemeDialog(false);
                setThemeMode(v as (typeof THEME_MODES)[number]);
              }}
            >
              {THEME_MODES.map((m) => (
                <RadioButton.Item key={m} value={m} label={i18n.t(`settings.theme_${m}`)} color={colors.primary} />
              ))}
            </RadioButton.Group>
          </Dialog.Content>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const useStyles = makeStyles((colors) => ({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 24 },
  switch: { alignSelf: 'center' },
  footer: { alignItems: 'center', marginTop: 28, gap: 2 },
  footerName: { color: colors.textSecondary },
  footerVersion: { color: colors.textSecondary },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeChip: { backgroundColor: colors.surfaceVariant },
  timeChipSelected: { backgroundColor: colors.primary },
  timeChipTextSelected: { color: '#fff' },
}));
