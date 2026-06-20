import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Divider } from 'react-native-paper';
import { colors } from '@/src/theme/colors';
import { formatCurrency } from '@/src/utils/formatters';
import type { SalaryBreakdown as SalaryBreakdownType } from '@/src/types';
import i18n from '@/src/i18n';

interface SalaryBreakupProps {
  breakdown: SalaryBreakdownType;
}

function StatTile({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[styles.tile, { backgroundColor: color + '14' }]}>
      <Text style={[styles.tileValue, { color }]}>{value}</Text>
      <Text variant="bodySmall" style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.row}>
      <Text variant="bodyMedium" style={styles.rowLabel}>{label}</Text>
      <Text variant="bodyMedium" style={[styles.rowValue, color ? { color } : null]}>{value}</Text>
    </View>
  );
}

export function SalaryBreakup({ breakdown }: SalaryBreakupProps) {
  const owes = breakdown.balanceDue > 0;
  const isAdvance = breakdown.balanceDue < 0;
  const balanceColor = owes ? colors.error : colors.primary;

  return (
    <Card style={styles.card} mode="elevated">
      <Card.Content>
        <Text variant="titleSmall" style={styles.sectionTitle}>{i18n.t('common.this_month')}</Text>

        <View style={styles.grid}>
          <StatTile label={i18n.t('salary.present_days')} value={String(breakdown.presentDays)} color={colors.present} />
          <StatTile label={i18n.t('salary.absent_days')} value={String(breakdown.absentDays)} color={colors.absent} />
          <StatTile label={i18n.t('salary.half_days')} value={String(breakdown.halfDays)} color={colors.halfDay} />
          <StatTile label={i18n.t('salary.paid_leaves')} value={String(breakdown.paidLeaves)} color={colors.paidLeave} />
        </View>

        {breakdown.overtimeHours > 0 && (
          <Row label={i18n.t('salary.overtime_hours')} value={String(breakdown.overtimeHours)} />
        )}

        <Divider style={styles.divider} />
        <Row label={i18n.t('salary.earned')} value={formatCurrency(breakdown.earnedSalary)} />
        <Row label={i18n.t('salary.paid')} value={formatCurrency(breakdown.totalPaid)} color={colors.primary} />

        <View style={[styles.balanceBox, { backgroundColor: balanceColor + '14' }]}>
          <Text variant="titleMedium" style={styles.balanceLabel}>
            {isAdvance ? i18n.t('payment.advance') : i18n.t('salary.balance')}
          </Text>
          <Text variant="titleLarge" style={[styles.balanceValue, { color: balanceColor }]}>
            {formatCurrency(Math.abs(breakdown.balanceDue))}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginVertical: 8, backgroundColor: colors.surface, borderRadius: 20 },
  sectionTitle: { color: colors.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: '47.5%', flexGrow: 1, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 12, alignItems: 'center' },
  tileValue: { fontSize: 26, fontWeight: '700', lineHeight: 30 },
  tileLabel: { color: colors.textSecondary, marginTop: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  rowLabel: { color: colors.textSecondary },
  rowValue: { fontWeight: '600' },
  divider: { marginVertical: 12 },
  balanceBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  balanceLabel: { fontWeight: '600' },
  balanceValue: { fontWeight: '700' },
});
