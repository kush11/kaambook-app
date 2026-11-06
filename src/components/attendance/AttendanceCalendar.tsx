import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import dayjs from 'dayjs';
import { makeStyles, useColors, type Palette } from '@/src/theme';
import type { Attendance, AttendanceStatus } from '@/src/types';
import { getDaysInMonth, isToday, isFuture } from '@/src/utils/date';

interface AttendanceCalendarProps {
  year: number;
  month: number;
  records: Attendance[];
  onDayPress: (date: string) => void;
  /** Highlights one day (used when the calendar is a date picker). */
  selectedDate?: string;
}

const STATUS_COLORS: Record<AttendanceStatus, keyof Palette> = {
  present: 'present',
  absent: 'absent',
  half_day: 'halfDay',
  paid_leave: 'paidLeave',
  unpaid_leave: 'absent',
  holiday: 'holiday',
  week_off: 'weekOff',
};

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function AttendanceCalendar({ year, month, records, onDayPress, selectedDate }: AttendanceCalendarProps) {
  const styles = useStyles();
  const colors = useColors();
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
          const selected = date === selectedDate;
          return (
            <TouchableOpacity
              key={date}
              style={[
                styles.cell,
                todayDate && styles.todayCell,
                selected && styles.selectedCell,
              ]}
              onPress={() => !future && onDayPress(date)}
              disabled={future}
            >
              <Text
                variant="bodySmall"
                style={[styles.dayText, future && styles.futureText, selected && styles.selectedText]}
              >
                {day}
              </Text>
              {status && (
                <View style={[styles.dot, { backgroundColor: colors[STATUS_COLORS[status]] }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  container: { paddingHorizontal: 8 },
  row: { flexDirection: 'row' },
  headerCell: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  headerText: { color: colors.textSecondary },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.28%' as `${number}%`, alignItems: 'center', paddingVertical: 8 },
  todayCell: { backgroundColor: colors.surfaceVariant, borderRadius: 20 },
  selectedCell: { backgroundColor: colors.primary, borderRadius: 20 },
  selectedText: { color: '#fff', fontWeight: '700' },
  dayText: { fontSize: 14 },
  futureText: { color: colors.textSecondary, opacity: 0.4 },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 4 },
}));
