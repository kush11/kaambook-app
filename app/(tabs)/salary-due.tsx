import React, { useCallback, useEffect, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { router, useFocusEffect } from 'expo-router';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { StaffAvatar } from '@/src/components/staff/StaffAvatar';
import { MonthNavigator } from '@/src/components/attendance/MonthNavigator';
import { useStaffStore } from '@/src/stores/useStaffStore';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { colors } from '@/src/theme/colors';
import { formatCurrency } from '@/src/utils/formatters';
import { calculateSalary } from '@/src/utils/salary';
import { db } from '@/src/db/client';
import { attendance, payments } from '@/src/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import dayjs from 'dayjs';
import type { Staff, SalaryBreakdown, Attendance, Payment } from '@/src/types';
import i18n from '@/src/i18n';

interface StaffDue {
  staff: Staff;
  breakdown: SalaryBreakdown;
}

export default function SalaryDueScreen() {
  const { staffList, loadStaff } = useStaffStore();
  const { activeBusinessId } = useSettingsStore();
  const [year, setYear] = useState(dayjs().year());
  const [month, setMonth] = useState(dayjs().month());
  const [dues, setDues] = useState<StaffDue[]>([]);

  const loadDues = useCallback(async () => {
    if (!activeBusinessId) return;
    try {
      await loadStaff(activeBusinessId);
      const startDate = dayjs().year(year).month(month).startOf('month').format('YYYY-MM-DD');
      const endDate = dayjs().year(year).month(month).endOf('month').format('YYYY-MM-DD');

      const results: StaffDue[] = [];
      for (const s of staffList.filter(s => s.status === 'active')) {
        const att = await db.select().from(attendance)
          .where(and(eq(attendance.staffId, s.id), gte(attendance.date, startDate), lte(attendance.date, endDate))) as Attendance[];
        const pay = await db.select().from(payments)
          .where(and(eq(payments.staffId, s.id), gte(payments.date, startDate), lte(payments.date, endDate))) as Payment[];
        const breakdown = calculateSalary(s, att, pay, year, month);
        if (breakdown.balanceDue !== 0) {
          results.push({ staff: s, breakdown });
        }
      }
      results.sort((a, b) => b.breakdown.balanceDue - a.breakdown.balanceDue);
      setDues(results);
    } catch (e) {
      console.error('Failed to load salary dues:', e);
    }
  }, [activeBusinessId, year, month, staffList.length]);

  useFocusEffect(useCallback(() => { loadDues(); }, [loadDues]));

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const totalDue = dues.reduce((s, d) => s + d.breakdown.balanceDue, 0);

  return (
    <View style={styles.container}>
      <MonthNavigator year={year} month={month} onPrev={prevMonth} onNext={nextMonth} />
      <Card style={styles.totalCard}>
        <Card.Content style={styles.totalContent}>
          <Text variant="bodyMedium" style={styles.totalLabel}>{i18n.t('salary.due')}</Text>
          <Text variant="headlineMedium" style={[styles.totalAmount, { color: totalDue > 0 ? colors.error : colors.primary }]}>
            {formatCurrency(totalDue)}
          </Text>
        </Card.Content>
      </Card>
      <FlatList
        data={dues}
        keyExtractor={item => item.staff.id}
        renderItem={({ item }) => (
          <Card style={styles.card} onPress={() => router.push(`/staff/${item.staff.id}`)}>
            <Card.Content style={styles.cardContent}>
              <StaffAvatar name={item.staff.name} photoUri={item.staff.photoUri} size={40} />
              <View style={styles.cardInfo}>
                <Text variant="titleSmall">{item.staff.name}</Text>
                <Text variant="bodySmall" style={styles.earned}>
                  {i18n.t('salary.earned')}: {formatCurrency(item.breakdown.earnedSalary)}
                </Text>
              </View>
              <Text
                variant="titleMedium"
                style={{ color: item.breakdown.balanceDue > 0 ? colors.error : colors.primary }}
              >
                {formatCurrency(item.breakdown.balanceDue)}
              </Text>
            </Card.Content>
          </Card>
        )}
        contentContainerStyle={dues.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={
          <EmptyState icon="check-circle" title={i18n.t('common.no_data')} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  totalCard: { margin: 16, marginTop: 8, backgroundColor: '#fff' },
  totalContent: { alignItems: 'center', paddingVertical: 16 },
  totalLabel: { color: colors.textSecondary },
  totalAmount: { fontWeight: 'bold', marginTop: 4 },
  list: { paddingBottom: 16 },
  emptyContainer: { flex: 1 },
  card: { marginHorizontal: 16, marginVertical: 4, backgroundColor: '#fff' },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  cardInfo: { flex: 1, marginLeft: 12 },
  earned: { color: colors.textSecondary, marginTop: 2 },
});
