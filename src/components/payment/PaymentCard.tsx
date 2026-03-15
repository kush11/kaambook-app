import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, IconButton } from 'react-native-paper';
import { colors } from '@/src/theme/colors';
import { formatCurrency } from '@/src/utils/formatters';
import { formatDate } from '@/src/utils/date';
import type { Payment } from '@/src/types';
import i18n from '@/src/i18n';

interface PaymentCardProps {
  payment: Payment;
  onDelete?: () => void;
}

const TYPE_ICONS: Record<string, string> = {
  salary: 'cash',
  advance: 'cash-fast',
  bonus: 'gift',
  penalty: 'alert-circle',
};

export function PaymentCard({ payment, onDelete }: PaymentCardProps) {
  const isDeduction = payment.type === 'penalty';
  return (
    <Card style={styles.card}>
      <Card.Content style={styles.content}>
        <View style={styles.left}>
          <Text variant="titleSmall">{i18n.t(`payment.${payment.type}`)}</Text>
          <Text variant="bodySmall" style={styles.meta}>
            {formatDate(payment.date)} • {i18n.t(`payment.${payment.mode}`)}
          </Text>
          {payment.note ? <Text variant="bodySmall" style={styles.note}>{payment.note}</Text> : null}
        </View>
        <Text
          variant="titleMedium"
          style={{ color: isDeduction ? colors.error : colors.primary }}
        >
          {isDeduction ? '-' : '+'}{formatCurrency(payment.amount)}
        </Text>
        {onDelete && (
          <IconButton icon="delete-outline" size={20} onPress={onDelete} />
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginVertical: 4, backgroundColor: '#fff' },
  content: { flexDirection: 'row', alignItems: 'center' },
  left: { flex: 1 },
  meta: { color: colors.textSecondary, marginTop: 2 },
  note: { color: colors.textSecondary, marginTop: 2, fontStyle: 'italic' },
});
