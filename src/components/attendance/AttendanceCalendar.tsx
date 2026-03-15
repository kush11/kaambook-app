import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import dayjs from 'dayjs';
import { colors } from '@/src/theme/colors';
import type { Attendance, AttendanceStatus } from '@/src/types';
import { getDaysInMonth, isToday, isFuture } from '@/src/utils/date';

interface AttendanceCalendarProps {
  year: number;
  month: number;
  records: Attendance[];
  onDayPress: (date: string) => void;
}

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  present: colors.present,
  absent: colors.absent,
  half_day: colors.halfDay,
  paid_leave: colors.paidLeave,
  unpaid_leave: colors.absent,
  holiday: colors.holiday,
  week_off: colors.weekOff,
};

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function AttendanceCalendar({ year, month, records, onDayPress }: AttendanceCalendarProps) {
  const days = getDaysInMonth(year, month);
  const firstDayOfWeek = dayjs(days[0]).day();
  const attendanceMap = new Map<string, AttendanceStatus>();
  records.forEach(r => attendanceMap.set(r.date, r.status as AttendanceStatus));

  // Build grid with leading empty cells
  const cells: (string | null)[] = Array(firstDayOfWeek).fill(null).concat(days);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {DAY_LABELS.map((d, i) => (
          <View key={i} style={styles.headerCell}>
            <Text variant="labelSmall" style={styles.headerText}>{d}</Text>
          </View>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((date, i) => {
          if (!date) return <View key={`empty-${i}`} style={styles.cell} />;
          const day = dayjs(date).date();
          const status = attendanceMap.get(date);
          const future = isFuture(date);
          const todayDate = isToday(date);
          return (
            <TouchableOpacity
              key={date}
              style={[
                styles.cell,
                todayDate && styles.todayCell,
              ]}
              onPress={() => !future && onDayPress(date)}
              disabled={future}
            >
              <Text
                variant="bodySmall"
                style={[styles.dayText, future && styles.futureText]}
              >
                {day}
              </Text>
              {status && (
                <View style={[styles.dot, { backgroundColor: STATUS_COLORS[status] }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 8 },
  row: { flexDirection: 'row' },
  headerCell: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  headerText: { color: colors.textSecondary },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.28%' as `${number}%`, alignItems: 'center', paddingVertical: 8 },
  todayCell: { backgroundColor: colors.surfaceVariant, borderRadius: 20 },
  dayText: { fontSize: 14 },
  futureText: { color: colors.border },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 4 },
});
