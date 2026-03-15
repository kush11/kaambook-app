import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, TextInput, Portal, Modal } from 'react-native-paper';
import { colors } from '@/src/theme/colors';
import type { AttendanceStatus } from '@/src/types';
import { formatDate } from '@/src/utils/date';
import i18n from '@/src/i18n';

interface AttendanceSheetProps {
  visible: boolean;
  date: string;
  currentStatus?: AttendanceStatus;
  onMark: (status: AttendanceStatus, note?: string, overtimeHours?: number) => void;
  onDismiss: () => void;
}

const STATUSES: { key: AttendanceStatus; color: string; icon: string }[] = [
  { key: 'present', color: colors.present, icon: 'check' },
  { key: 'absent', color: colors.absent, icon: 'close' },
  { key: 'half_day', color: colors.halfDay, icon: 'circle-half-full' },
  { key: 'paid_leave', color: colors.paidLeave, icon: 'calendar-check' },
  { key: 'unpaid_leave', color: colors.absent, icon: 'calendar-remove' },
  { key: 'holiday', color: colors.holiday, icon: 'party-popper' },
  { key: 'week_off', color: colors.weekOff, icon: 'calendar-blank' },
];

export function AttendanceSheet({ visible, date, currentStatus, onMark, onDismiss }: AttendanceSheetProps) {
  const [selected, setSelected] = useState<AttendanceStatus | undefined>(currentStatus);
  const [note, setNote] = useState('');
  const [overtime, setOvertime] = useState('');

  const handleSave = () => {
    if (!selected) return;
    onMark(selected, note || undefined, Number(overtime) || 0);
    setNote('');
    setOvertime('');
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modal}>
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
              buttonColor={selected === s.key ? s.color : undefined}
              textColor={selected === s.key ? '#fff' : s.color}
              compact
            >
              {i18n.t(`attendance.${s.key}`)}
            </Button>
          ))}
        </View>
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
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 16,
    padding: 20,
  },
  title: { textAlign: 'center', marginBottom: 16 },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  statusBtn: { marginBottom: 4 },
  input: { marginBottom: 12 },
  saveBtn: { marginTop: 8 },
});
