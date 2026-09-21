import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Text, TouchableRipple } from 'react-native-paper';
import { StaffAvatar } from './StaffAvatar';
import { colors } from '@/src/theme/colors';
import { formatCurrency } from '@/src/utils/formatters';
import type { Staff, AttendanceStatus } from '@/src/types';
import i18n from '@/src/i18n';

interface StaffCardProps {
  staff: Staff;
  todayStatus?: AttendanceStatus;
  onPress: () => void;
  onMarkAttendance: (status: AttendanceStatus) => void;
  /** Rows sit in one grouped list; the ends get the rounded corners. */
  isFirst?: boolean;
  isLast?: boolean;
}

// P / A / ½ are the marks used in paper attendance registers, so they stay the
// same in every language; the spoken label is translated.
const marks: { status: AttendanceStatus; letter: string; color: string; labelKey: string }[] = [
  { status: 'present', letter: 'P', color: colors.present, labelKey: 'attendance.present' },
  { status: 'absent', letter: 'A', color: colors.absent, labelKey: 'attendance.absent' },
  { status: 'half_day', letter: '½', color: colors.halfDay, labelKey: 'attendance.half_day' },
];

const salarySuffix = { monthly: 'salary.per_month', daily: 'salary.per_day', weekly: 'salary.per_week' } as const;

export function StaffCard({ staff, todayStatus, onPress, onMarkAttendance, isFirst, isLast }: StaffCardProps) {
  const suffixKey = salarySuffix[staff.salaryType as keyof typeof salarySuffix] ?? 'salary.per_month';

  return (
    <View style={[styles.row, isFirst && styles.first, isLast && styles.last]}>
      <TouchableRipple onPress={onPress} style={styles.touchable}>
        <View style={styles.content}>
          <StaffAvatar name={staff.name} photoUri={staff.photoUri} size={40} />
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>{staff.name}</Text>
            <Text style={styles.salary} numberOfLines={1}>
              {formatCurrency(staff.salaryAmount)}{i18n.t(suffixKey)}
            </Text>
          </View>
          <View style={styles.actions}>
            {marks.map((m) => {
              const selected = todayStatus === m.status;
              return (
                <Pressable
                  key={m.status}
                  onPress={() => onMarkAttendance(m.status)}
                  accessibilityRole="button"
                  accessibilityLabel={`${i18n.t(m.labelKey)}: ${staff.name}`}
                  accessibilityState={{ selected }}
                  style={[styles.chip, selected && { backgroundColor: m.color }]}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{m.letter}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </TouchableRipple>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginHorizontal: 16,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    overflow: 'hidden',
  },
  first: { borderTopWidth: 1, borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  last: { borderBottomColor: colors.border, borderBottomLeftRadius: 18, borderBottomRightRadius: 18 },
  touchable: { paddingVertical: 8, paddingLeft: 12, paddingRight: 10 },
  content: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: colors.text },
  salary: { fontSize: 13, color: colors.textSecondary, marginTop: 1 },
  actions: { flexDirection: 'row', gap: 6 },
  chip: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceVariant,
  },
  chipText: { fontSize: 16, fontWeight: '700', color: colors.textSecondary },
  chipTextSelected: { color: '#fff' },
});
