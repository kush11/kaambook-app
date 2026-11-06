import React, { useEffect, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { Text, Button, TextInput, Portal, Modal, Chip } from 'react-native-paper';
import { makeStyles, useColors, type Palette } from '@/src/theme';
import type { Attendance, AttendanceStatus } from '@/src/types';
import type { MarkExtra } from '@/src/stores/useAttendanceStore';
import { formatDate } from '@/src/utils/date';
import { useKeyboardHeight } from '@/src/utils/useKeyboardHeight';
import i18n from '@/src/i18n';

interface AttendanceSheetProps {
  visible: boolean;
  date: string;
  /** The day's existing record, so the sheet opens with it filled in. */
  current?: Attendance;
  /** Hourly staff: show "hours worked", defaulting to their shift hours. */
  hourly?: boolean;
  shiftHours?: number;
  onMark: (status: AttendanceStatus, note?: string, overtimeHours?: number, extra?: MarkExtra) => void;
  onDismiss: () => void;
}

const STATUSES: { key: AttendanceStatus; color: keyof Palette; icon: string }[] = [
  { key: 'present', color: 'present', icon: 'check' },
  { key: 'absent', color: 'absent', icon: 'close' },
  { key: 'half_day', color: 'halfDay', icon: 'circle-half-full' },
  { key: 'paid_leave', color: 'paidLeave', icon: 'calendar-check' },
  { key: 'unpaid_leave', color: 'absent', icon: 'calendar-remove' },
  { key: 'holiday', color: 'holiday', icon: 'party-popper' },
  { key: 'week_off', color: 'weekOff', icon: 'calendar-blank' },
];

export function AttendanceSheet({ visible, date, current, hourly, shiftHours = 8, onMark, onDismiss }: AttendanceSheetProps) {
  const styles = useStyles();
  const colors = useColors();
  const [selected, setSelected] = useState<AttendanceStatus | undefined>(current?.status);
  const [note, setNote] = useState('');
  const [overtime, setOvertime] = useState('');
  const [late, setLate] = useState(false);
  const [hours, setHours] = useState('');
  const keyboardHeight = useKeyboardHeight();

  // Each time the sheet opens for a day, start from that day's saved record.
  useEffect(() => {
    if (!visible) return;
    setSelected(current?.status);
    setNote(current?.note ?? '');
    setOvertime(current?.overtimeHours ? String(current.overtimeHours) : '');
    setLate(!!current?.isLate);
    setHours(current?.hoursWorked != null ? String(current.hoursWorked) : '');
  }, [visible, date, current]);

  const worked = selected === 'present' || selected === 'half_day';
  const defaultHours = selected === 'half_day' ? shiftHours / 2 : shiftHours;

  const handleSave = () => {
    if (!selected) return;
    const h = Number(hours);
    onMark(selected, note || undefined, Number(overtime) || 0, {
      isLate: worked && late,
      // Empty or same as the default = follow the shift length (stored as null).
      ...(hourly && { hoursWorked: worked && hours && h > 0 && h !== defaultHours ? h : null }),
    });
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        style={{ paddingBottom: keyboardHeight }}
        contentContainerStyle={styles.modal}
      >
        <ScrollView keyboardShouldPersistTaps="handled">
          <Text variant="titleMedium" style={styles.title}>
            {formatDate(date)}
          </Text>
          <View style={styles.statusGrid}>
            {STATUSES.map(s => (
              <Button
                key={s.key}
                mode={selected === s.key ? 'contained' : 'outlined'}
                onPress={() => setSelected(s.key)}
                style={styles.statusBtn}
                buttonColor={selected === s.key ? colors[s.color] : undefined}
                textColor={selected === s.key ? '#fff' : colors[s.color]}
                compact
              >
                {i18n.t(`attendance.${s.key}`)}
              </Button>
            ))}
          </View>
          {worked && (
            <View style={styles.extraRow}>
              <Chip
                // Outlined when off: Paper's default (flat) chip is tinted, which reads as "on".
                mode={late ? 'flat' : 'outlined'}
                icon="clock-alert-outline"
                selected={late}
                showSelectedCheck={false}
                onPress={() => setLate((v) => !v)}
                style={late ? { backgroundColor: colors.halfDay } : undefined}
                textStyle={late ? styles.lateTextOn : undefined}
                selectedColor={late ? '#fff' : colors.halfDay}
              >
                {i18n.t('attendance.late')}
              </Chip>
            </View>
          )}
          {hourly && worked && (
            <TextInput
              mode="outlined"
              label={i18n.t('attendance.hours_worked')}
              value={hours}
              placeholder={String(defaultHours)}
              onChangeText={(t) => setHours(t.replace(/[^0-9.]/g, '').slice(0, 4))}
              keyboardType="decimal-pad"
              style={styles.input}
            />
          )}
          <TextInput
            mode="outlined"
            label={i18n.t('attendance.note')}
            value={note}
            onChangeText={setNote}
            style={styles.input}
          />
          <TextInput
            mode="outlined"
            label={i18n.t('attendance.overtime')}
            value={overtime}
            onChangeText={setOvertime}
            keyboardType="numeric"
            style={styles.input}
          />
          <Button mode="contained" onPress={handleSave} disabled={!selected} style={styles.saveBtn}>
            {i18n.t('attendance.mark_attendance')}
          </Button>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

const useStyles = makeStyles((colors) => ({
  modal: {
    backgroundColor: colors.surface,
    margin: 20,
    borderRadius: 16,
    padding: 20,
    flexShrink: 1, // lets the ScrollView scroll when the keyboard leaves little room
  },
  title: { textAlign: 'center', marginBottom: 16 },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  statusBtn: { marginBottom: 4 },
  input: { marginBottom: 12 },
  extraRow: { flexDirection: 'row', marginBottom: 12 },
  lateTextOn: { color: '#fff' },
  saveBtn: { marginTop: 8 },
}));
