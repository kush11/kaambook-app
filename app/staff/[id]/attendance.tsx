import React, { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { AttendanceCalendar } from '@/src/components/attendance/AttendanceCalendar';
import { AttendanceSheet } from '@/src/components/attendance/AttendanceSheet';
import { MonthNavigator } from '@/src/components/attendance/MonthNavigator';
import { useAttendanceStore } from '@/src/stores/useAttendanceStore';
import { useStaffStore } from '@/src/stores/useStaffStore';
import { colors } from '@/src/theme/colors';
import dayjs from 'dayjs';
import type { AttendanceStatus } from '@/src/types';
import i18n from '@/src/i18n';

export default function AttendanceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { records, loadMonthAttendance, markAttendance, getMonthSummary } = useAttendanceStore();
  const { getStaffById } = useStaffStore();
  const [year, setYear] = useState(dayjs().year());
  const [month, setMonth] = useState(dayjs().month());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [summary, setSummary] = useState<Record<string, number>>({});

  const staffMember = getStaffById(id);

  const loadData = useCallback(async () => {
    await loadMonthAttendance(id, year, month);
    const s = await getMonthSummary(id, year, month);
    setSummary(s);
  }, [id, year, month]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const handleMark = async (status: AttendanceStatus, note?: string, overtimeHours?: number) => {
    if (selectedDate) {
      await markAttendance(id, selectedDate, status, note, overtimeHours);
      const s = await getMonthSummary(id, year, month);
      setSummary(s);
      setSelectedDate(null);
    }
  };

  const currentRecord = selectedDate ? records.find(r => r.date === selectedDate) : undefined;

  return (
    <View style={styles.container}>
      <MonthNavigator year={year} month={month} onPrev={prevMonth} onNext={nextMonth} />

      <ScrollView>
        <Card style={styles.calendarCard}>
          <Card.Content>
            <AttendanceCalendar
              year={year}
              month={month}
              records={records}
              onDayPress={setSelectedDate}
            />
          </Card.Content>
        </Card>

        {/* Summary */}
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text variant="titleSmall" style={styles.summaryTitle}>{i18n.t('attendance.title')}</Text>
            <View style={styles.summaryGrid}>
              <SummaryItem label={i18n.t('attendance.present')} value={summary.present || 0} color={colors.present} />
              <SummaryItem label={i18n.t('attendance.absent')} value={summary.absent || 0} color={colors.absent} />
              <SummaryItem label={i18n.t('attendance.half_day')} value={summary.half_day || 0} color={colors.halfDay} />
              <SummaryItem label={i18n.t('attendance.paid_leave')} value={summary.paid_leave || 0} color={colors.paidLeave} />
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      <AttendanceSheet
        visible={!!selectedDate}
        date={selectedDate || ''}
        currentStatus={currentRecord?.status as AttendanceStatus | undefined}
        onMark={handleMark}
        onDismiss={() => setSelectedDate(null)}
      />
    </View>
  );
}

function SummaryItem({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={summaryStyles.item}>
      <Text variant="headlineSmall" style={{ color, fontWeight: 'bold' }}>{value}</Text>
      <Text variant="bodySmall" style={summaryStyles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  calendarCard: { margin: 16, backgroundColor: '#fff' },
  summaryCard: { margin: 16, marginTop: 0, backgroundColor: '#fff' },
  summaryTitle: { marginBottom: 12 },
  summaryGrid: { flexDirection: 'row', justifyContent: 'space-around' },
});

const summaryStyles = StyleSheet.create({
  item: { alignItems: 'center' },
  label: { color: colors.textSecondary, marginTop: 4 },
});
