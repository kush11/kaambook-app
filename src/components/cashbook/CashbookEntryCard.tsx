import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, IconButton } from 'react-native-paper';
import { colors } from '@/src/theme/colors';
import { formatCurrency } from '@/src/utils/formatters';
import { formatDate } from '@/src/utils/date';
import type { CashbookEntry } from '@/src/types';

interface Props {
  entry: CashbookEntry;
  onDelete?: () => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  wages: 'account-cash',
  material: 'package-variant',
  transport: 'truck',
  food: 'food',
  rent: 'home',
  other: 'dots-horizontal-circle',
  sales: 'cart',
  payment_received: 'cash-check',
  other_income: 'cash-plus',
};

const CATEGORY_LABELS: Record<string, string> = {
  wages: 'Wages',
  material: 'Material',
  transport: 'Transport',
  food: 'Food',
  rent: 'Rent',
  other: 'Other',
  sales: 'Sales',
  payment_received: 'Payment Received',
  other_income: 'Other Income',
};

export function CashbookEntryCard({ entry, onDelete }: Props) {
  const isExpense = entry.type === 'expense';
  return (
    <Card style={styles.card}>
      <Card.Content style={styles.content}>
        <View style={styles.left}>
          <Text variant="titleSmall">{CATEGORY_LABELS[entry.category] || entry.category}</Text>
          <Text variant="bodySmall" style={styles.meta}>
            {formatDate(entry.date)}
          </Text>
          {entry.description ? <Text variant="bodySmall" style={styles.desc}>{entry.description}</Text> : null}
        </View>
        <Text
          variant="titleMedium"
          style={{ color: isExpense ? colors.error : colors.primary, fontWeight: 'bold' }}
        >
          {isExpense ? '-' : '+'}{formatCurrency(entry.amount)}
        </Text>
        {onDelete && <IconButton icon="delete-outline" size={20} onPress={onDelete} />}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginVertical: 4, backgroundColor: '#fff' },
  content: { flexDirection: 'row', alignItems: 'center' },
  left: { flex: 1 },
  meta: { color: colors.textSecondary, marginTop: 2 },
  desc: { color: colors.textSecondary, marginTop: 2, fontStyle: 'italic' },
});
