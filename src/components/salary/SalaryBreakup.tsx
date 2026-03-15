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

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.row}>
      <Text variant="bodyMedium" style={styles.rowLabel}>{label}</Text>
      <Text variant="bodyMedium" style={[styles.rowValue, color ? { color } : null]}>{value}</Text>
    </View>
  );
}

export function SalaryBreakup({ breakdown }: SalaryBreakupProps) {
  return (
    <Card style={styles.card}>
      <Card.Content>
        <Row label={i18n.t('salary.present_days')} value={String(breakdown.presentDays)} color={colors.present} />
        <Row label={i18n.t('salary.absent_days')} value={String(breakdown.absentDays)} color={colors.absent} />
        <Row label={i18n.t('salary.half_days')} value={String(breakdown.halfDays)} color={colors.halfDay} />
        <Row label={i18n.t('salary.paid_leaves')} value={String(breakdown.paidLeaves)} color={colors.paidLeave} />
        {breakdown.overtimeHours > 0 && (
          <Row label={i18n.t('salary.overtime_hours')} value={String(breakdown.overtimeHours)} />
        )}
        <Divider style={styles.divider} />
        <Row label={i18n.t('salary.earned')} value={formatCurrency(breakdown.earnedSalary)} />
        <Row label={i18n.t('salary.paid')} value={formatCurrency(breakdown.totalPaid)} color={colors.primary} />
        <Divider style={styles.divider} />
        <Row
          label={i18n.t('salary.balance')}
          value={formatCurrency(breakdown.balanceDue)}
          color={breakdown.balanceDue > 0 ? colors.error : colors.primary}
        />
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginVertical: 8, backgroundColor: '#fff' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  rowLabel: { color: colors.textSecondary },
  rowValue: { fontWeight: '600' },
  divider: { marginVertical: 8 },
});
