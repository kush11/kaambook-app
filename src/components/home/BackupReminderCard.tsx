import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Button } from 'react-native-paper';
import dayjs from 'dayjs';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { useStaffStore } from '@/src/stores/useStaffStore';
import { createBackup } from '@/src/utils/backup';
import { track, trackError } from '@/src/utils/analytics';
import { colors } from '@/src/theme/colors';
import i18n from '@/src/i18n';

// Never backed up: remind once the first staff record is a week old.
const FIRST_REMINDER_DAYS = 7;
// Backed up before: remind again after a month.
const REPEAT_REMINDER_DAYS = 30;
// "Not Now" hides the card for a week.
const SNOOZE_DAYS = 7;

let shownThisSession = false;

/**
 * Nudges the owner to back up, since all records live only on this phone.
 * Renders nothing while the phone-number prompt is showing, so the home
 * screen never stacks two cards.
 */
export function BackupReminderCard() {
  const { isOnboarded, ownerPhone, phonePromptDismissed, lastBackupAt, backupReminderSnoozedAt, snoozeBackupReminder } =
    useSettingsStore();
  const { staffList } = useStaffStore();
  const [loading, setLoading] = useState(false);

  const phonePromptVisible = isOnboarded && !ownerPhone && !phonePromptDismissed;
  const snoozed = !!backupReminderSnoozedAt && dayjs().diff(dayjs(backupReminderSnoozedAt), 'day') < SNOOZE_DAYS;
  const firstStaffAt = staffList.map((s) => s.createdAt).sort()[0];
  const due = lastBackupAt
    ? dayjs().diff(dayjs(lastBackupAt), 'day') >= REPEAT_REMINDER_DAYS
    : !!firstStaffAt && dayjs().diff(dayjs(firstStaffAt), 'day') >= FIRST_REMINDER_DAYS;
  const visible = isOnboarded && !phonePromptVisible && !snoozed && due;

  useEffect(() => {
    if (visible && !shownThisSession) {
      shownThisSession = true;
      track('backup_reminder_shown', { ever_backed_up: !!lastBackupAt });
    }
  }, [visible, lastBackupAt]);

  if (!visible) return null;

  const handleBackup = async () => {
    track('backup_reminder_tapped');
    setLoading(true);
    try {
      await createBackup();
    } catch (e) {
      trackError('backup_create', e);
    }
    setLoading(false);
  };

  const handleLater = async () => {
    track('backup_reminder_snoozed');
    await snoozeBackupReminder();
  };

  return (
    <Card style={styles.card} mode="outlined">
      <Card.Content>
        <Text variant="titleMedium" style={styles.title}>
          {i18n.t('backup_reminder.title')}
        </Text>
        <Text variant="bodySmall" style={styles.subtitle}>
          {i18n.t('backup_reminder.subtitle')}
        </Text>
        <View style={styles.actions}>
          <Button mode="text" onPress={handleLater} textColor={colors.textSecondary}>
            {i18n.t('phone_prompt.later')}
          </Button>
          <Button mode="contained" icon="cloud-upload" onPress={handleBackup} loading={loading}>
            {i18n.t('backup_reminder.action')}
          </Button>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 12, marginTop: 10, backgroundColor: colors.surface },
  title: { color: colors.text, fontWeight: 'bold' },
  subtitle: { color: colors.textSecondary, marginTop: 2 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 10 },
});
