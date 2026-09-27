import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Button } from 'react-native-paper';
import dayjs from 'dayjs';
import { useStaffStore } from '@/src/stores/useStaffStore';
import { useAttendanceStore } from '@/src/stores/useAttendanceStore';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { colors } from '@/src/theme/colors';
import { today } from '@/src/utils/date';
import { track } from '@/src/utils/analytics';
import type { AttendanceStatus } from '@/src/types';
import i18n from '@/src/i18n';

interface FirstAttendanceCardProps {
  /** Today's attendance by staff id, so the card hides once the mark is made from the row itself. */
  todayRecords: Map<string, AttendanceStatus>;
  onMarked: () => void;
}

/**
 * Shown on Home right after the very first staff member is added. Half of new
 * users add staff and never mark attendance, so this asks for today's mark
 * before the user has to find the P / A chips on their own.
 */
export function FirstAttendanceCard({ todayRecords, onMarked }: FirstAttendanceCardProps) {
  const { firstStaffNudgeId, clearFirstStaffNudge, staffList } = useStaffStore();
  const { reminderEnabled, reminderTime } = useSettingsStore();
  const { markAttendance } = useAttendanceStore();

  const staff = firstStaffNudgeId ? staffList.find((s) => s.id === firstStaffNudgeId) : undefined;
  if (!staff || todayRecords.has(staff.id)) return null;

  const handleMark = async (status: AttendanceStatus) => {
    await markAttendance(staff.id, today(), status);
    track('first_attendance_nudge', { action: status });
    clearFirstStaffNudge();
    onMarked();
  };

  const handleLater = () => {
    track('first_attendance_nudge', { action: 'later' });
    clearFirstStaffNudge();
  };

  const reminderAt = dayjs(`2000-01-01T${reminderTime}`).format('h:mm A');

  return (
    <Card style={styles.card} mode="outlined">
      <Card.Content>
        <Text variant="titleMedium" style={styles.title}>
          {i18n.t('first_attendance.title', { name: staff.name })}
        </Text>
        <Text variant="bodySmall" style={styles.subtitle}>
          {i18n.t('first_attendance.subtitle')}
          {reminderEnabled ? ` ${i18n.t('first_attendance.reminder_on', { time: reminderAt })}` : ''}
        </Text>
        <View style={styles.actions}>
          <Button mode="text" onPress={handleLater} textColor={colors.textSecondary}>
            {i18n.t('phone_prompt.later')}
          </Button>
          <Button mode="outlined" onPress={() => handleMark('absent')} textColor={colors.absent}>
            {i18n.t('attendance.absent')}
          </Button>
          <Button mode="contained" icon="check" onPress={() => handleMark('present')} buttonColor={colors.present}>
            {i18n.t('attendance.present')}
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
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 },
});
