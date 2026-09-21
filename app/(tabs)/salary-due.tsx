import React, { useCallback, useEffect, useState } from 'react';
import { View, FlatList, ScrollView, StyleSheet } from 'react-native';
import { Text, Button, Portal, Modal, ActivityIndicator, IconButton, TouchableRipple } from 'react-native-paper';
import { router, useFocusEffect } from 'expo-router';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { StaffAvatar } from '@/src/components/staff/StaffAvatar';
import { MonthNavigator } from '@/src/components/attendance/MonthNavigator';
import { useStaffStore } from '@/src/stores/useStaffStore';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { useBusinessStore } from '@/src/stores/useBusinessStore';
import { colors } from '@/src/theme/colors';
import { formatCurrency } from '@/src/utils/formatters';
import { calculateSalary } from '@/src/utils/salary';
import { gatherMonthSummary, fetchAiSummary, isAiConfigured } from '@/src/utils/aiSummary';
import { trackError } from '@/src/utils/analytics';
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
  const { activeBusinessId, language } = useSettingsStore();
  const { activeBusiness } = useBusinessStore();
  const [year, setYear] = useState(dayjs().year());
  const [month, setMonth] = useState(dayjs().month());
  const [dues, setDues] = useState<StaffDue[]>([]);
  const [totals, setTotals] = useState({ earned: 0, paid: 0 });
  const [aiVisible, setAiVisible] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiText, setAiText] = useState('');
  const [aiError, setAiError] = useState('');

  const loadDues = useCallback(async () => {
    if (!activeBusinessId) return;
    try {
      await loadStaff(activeBusinessId);
      const startDate = dayjs().year(year).month(month).startOf('month').format('YYYY-MM-DD');
      const endDate = dayjs().year(year).month(month).endOf('month').format('YYYY-MM-DD');

      const results: StaffDue[] = [];
      // Earned and paid cover every active staff member, including those fully settled.
      let earned = 0;
      let paid = 0;
      for (const s of staffList.filter(s => s.status === 'active')) {
        const att = await db.select().from(attendance)
          .where(and(eq(attendance.staffId, s.id), gte(attendance.date, startDate), lte(attendance.date, endDate))) as Attendance[];
        const pay = await db.select().from(payments)
          .where(and(eq(payments.staffId, s.id), gte(payments.date, startDate), lte(payments.date, endDate))) as Payment[];
        const breakdown = calculateSalary(s, att, pay, year, month);
        earned += breakdown.earnedSalary;
        paid += breakdown.totalPaid;
        if (breakdown.balanceDue !== 0) {
          results.push({ staff: s, breakdown });
        }
      }
      results.sort((a, b) => b.breakdown.balanceDue - a.breakdown.balanceDue);
      setDues(results);
      setTotals({ earned, paid });
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

  // Share of earned salary already paid, as a 0-100 bar width.
  const paidPercent = (earned: number, paid: number) =>
    earned > 0 ? Math.min(100, Math.max(0, (paid / earned) * 100)) : paid > 0 ? 100 : 0;

  const openAiSummary = async () => {
    setAiVisible(true);
    setAiText('');
    setAiError('');
    if (!isAiConfigured()) {
      setAiError(i18n.t('ai.not_configured'));
      return;
    }
    setAiLoading(true);
    try {
      const data = await gatherMonthSummary(activeBusiness?.name || 'My Business', staffList, year, month);
      if (data.staff.length === 0) {
        setAiError(i18n.t('common.no_data'));
        return;
      }
      const text = await fetchAiSummary(data, language);
      setAiText(text);
    } catch (e) {
      trackError('ai_summary', e);
      setAiError(i18n.t('ai.error'));
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <MonthNavigator year={year} month={month} onPrev={prevMonth} onNext={nextMonth} />
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>{i18n.t('salary.balance')}</Text>
        <Text style={styles.totalAmount} numberOfLines={1} adjustsFontSizeToFit>
          {formatCurrency(totalDue)}
        </Text>
        <View style={styles.totalTrack}>
          <View style={[styles.totalFill, { width: `${paidPercent(totals.earned, totals.paid)}%` }]} />
        </View>
        <View style={styles.totalCaptions}>
          <Text style={styles.totalCaption}>{i18n.t('salary.paid')} {formatCurrency(totals.paid)}</Text>
          <Text style={styles.totalCaption}>{i18n.t('salary.earned')} {formatCurrency(totals.earned)}</Text>
        </View>
      </View>

      <Button
        mode="contained-tonal"
        icon="creation"
        onPress={openAiSummary}
        buttonColor={colors.primaryTint}
        textColor={colors.primaryDark}
        style={styles.aiBtn}
        contentStyle={styles.aiBtnContent}
        labelStyle={styles.aiBtnLabel}
      >
        {i18n.t('ai.summary_btn')}
      </Button>

      <FlatList
        data={dues}
        keyExtractor={item => item.staff.id}
        renderItem={({ item, index }) => {
          const { earnedSalary, totalPaid, balanceDue } = item.breakdown;
          const isAdvance = balanceDue < 0;
          return (
            <View style={[styles.row, index === 0 && styles.rowFirst, index === dues.length - 1 && styles.rowLast]}>
              <TouchableRipple onPress={() => router.push(`/staff/${item.staff.id}`)} style={styles.rowTouchable}>
                <View style={styles.rowContent}>
                  <StaffAvatar name={item.staff.name} photoUri={item.staff.photoUri} size={40} />
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowName} numberOfLines={1}>{item.staff.name}</Text>
                    <Text style={styles.rowMeta} numberOfLines={1}>
                      {i18n.t('salary.earned')} {formatCurrency(earnedSalary)} · {i18n.t('salary.paid')} {formatCurrency(totalPaid)}
                    </Text>
                    <View style={styles.rowTrack}>
                      <View style={[styles.rowFill, { width: `${paidPercent(earnedSalary, totalPaid)}%` }]} />
                    </View>
                  </View>
                  <View style={styles.rowDue}>
                    <Text style={[styles.rowAmount, isAdvance && styles.rowAmountAdvance]}>
                      {formatCurrency(Math.abs(balanceDue))}
                    </Text>
                    {isAdvance ? <Text style={styles.rowDueLabel}>{i18n.t('payment.advance')}</Text> : null}
                  </View>
                </View>
              </TouchableRipple>
            </View>
          );
        }}
        contentContainerStyle={dues.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={
          <EmptyState icon="check-circle" title={i18n.t('common.no_data')} />
        }
      />

      <Portal>
        <Modal
          visible={aiVisible}
          onDismiss={() => setAiVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <View style={styles.modalHeader}>
            <Text variant="titleMedium" style={styles.modalTitle}>{i18n.t('ai.summary_title')}</Text>
            <IconButton icon="close" size={20} onPress={() => setAiVisible(false)} />
          </View>
          <Text variant="bodySmall" style={styles.modalMonth}>
            {dayjs().year(year).month(month).format('MMMM YYYY')}
          </Text>

          {aiLoading ? (
            <View style={styles.modalCenter}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.modalHint}>{i18n.t('ai.generating')}</Text>
            </View>
          ) : aiError ? (
            <Text style={styles.modalError}>{aiError}</Text>
          ) : (
            <ScrollView style={styles.modalScroll}>
              <Text variant="bodyMedium" style={styles.modalBody}>{aiText}</Text>
            </ScrollView>
          )}

          {!aiLoading && !aiError ? (
            <Text style={styles.modalFootnote}>{i18n.t('ai.disclaimer')}</Text>
          ) : null}
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  totalCard: {
    marginHorizontal: 16,
    padding: 18,
    borderRadius: 20,
    backgroundColor: colors.primary,
  },
  totalLabel: { color: '#fff', fontSize: 14, fontWeight: '500' },
  totalAmount: { color: '#fff', fontSize: 38, fontWeight: '800', lineHeight: 46 },
  totalTrack: { height: 8, borderRadius: 4, backgroundColor: colors.primaryDark, overflow: 'hidden', marginTop: 8 },
  totalFill: { height: 8, borderRadius: 4, backgroundColor: '#fff' },
  totalCaptions: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: 8 },
  totalCaption: { color: '#fff', fontSize: 13, fontWeight: '500' },
  list: { paddingBottom: 16 },
  emptyContainer: { flex: 1 },
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
  rowFirst: { borderTopWidth: 1, borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  rowLast: { borderBottomColor: colors.border, borderBottomLeftRadius: 18, borderBottomRightRadius: 18 },
  rowTouchable: { paddingVertical: 10, paddingHorizontal: 12 },
  rowContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowInfo: { flex: 1, gap: 3 },
  rowName: { fontSize: 16, fontWeight: '600', color: colors.text },
  rowMeta: { fontSize: 13, color: colors.textSecondary },
  rowTrack: { height: 4, borderRadius: 2, backgroundColor: colors.divider, overflow: 'hidden', marginTop: 2 },
  rowFill: { height: 4, backgroundColor: colors.success },
  rowDue: { alignItems: 'flex-end' },
  rowAmount: { fontSize: 17, fontWeight: '700', color: colors.text },
  rowAmountAdvance: { color: colors.success },
  rowDueLabel: { fontSize: 12, color: colors.textSecondary },
  aiBtn: { marginHorizontal: 16, marginVertical: 12, borderRadius: 14 },
  aiBtnContent: { paddingVertical: 4 },
  aiBtnLabel: { fontWeight: '700' },
  modal: { backgroundColor: '#fff', margin: 20, borderRadius: 16, padding: 16, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { fontWeight: 'bold', flex: 1 },
  modalMonth: { color: colors.textSecondary, marginBottom: 12 },
  modalCenter: { alignItems: 'center', paddingVertical: 32 },
  modalHint: { color: colors.textSecondary, marginTop: 12 },
  modalError: { color: colors.error, paddingVertical: 16 },
  modalScroll: { maxHeight: 360 },
  modalBody: { lineHeight: 24, color: colors.text },
  modalFootnote: { fontSize: 11, color: colors.textSecondary, marginTop: 14, fontStyle: 'italic' },
});
