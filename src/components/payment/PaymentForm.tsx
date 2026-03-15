import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Button, SegmentedButtons, TextInput, Text } from 'react-native-paper';
import { AmountInput } from '../ui/AmountInput';
import { colors } from '@/src/theme/colors';
import type { PaymentType, PaymentMode } from '@/src/types';
import i18n from '@/src/i18n';

interface PaymentFormProps {
  onSubmit: (data: { amount: number; type: PaymentType; mode: PaymentMode; note: string }) => void;
  isLoading?: boolean;
}

export function PaymentForm({ onSubmit, isLoading }: PaymentFormProps) {
  const [amount, setAmount] = useState(0);
  const [type, setType] = useState<PaymentType>('salary');
  const [mode, setMode] = useState<PaymentMode>('cash');
  const [note, setNote] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = () => {
    if (amount <= 0) {
      setError(true);
      return;
    }
    onSubmit({ amount, type, mode, note });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AmountInput
        value={amount}
        onChangeValue={(v) => { setAmount(v); setError(false); }}
        label={i18n.t('payment.amount')}
        error={error}
      />

      <Text variant="labelLarge" style={styles.label}>{i18n.t('payment.type')}</Text>
      <SegmentedButtons
        value={type}
        onValueChange={(v) => setType(v as PaymentType)}
        buttons={[
          { value: 'salary', label: i18n.t('payment.salary') },
          { value: 'advance', label: i18n.t('payment.advance') },
          { value: 'bonus', label: i18n.t('payment.bonus') },
          { value: 'penalty', label: i18n.t('payment.penalty') },
        ]}
        style={styles.segment}
      />

      <Text variant="labelLarge" style={styles.label}>{i18n.t('payment.mode')}</Text>
      <SegmentedButtons
        value={mode}
        onValueChange={(v) => setMode(v as PaymentMode)}
        buttons={[
          { value: 'cash', label: i18n.t('payment.cash') },
          { value: 'upi', label: i18n.t('payment.upi') },
          { value: 'bank', label: i18n.t('payment.bank') },
        ]}
        style={styles.segment}
      />

      <TextInput
        mode="outlined"
        label={i18n.t('payment.note')}
        value={note}
        onChangeText={setNote}
        style={styles.input}
      />

      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={isLoading}
        style={styles.button}
        contentStyle={styles.buttonContent}
      >
        {i18n.t('payment.add')}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  label: { marginTop: 16, marginBottom: 8, color: colors.textSecondary },
  segment: { marginBottom: 8 },
  input: { marginTop: 16 },
  button: { marginTop: 24 },
  buttonContent: { paddingVertical: 6 },
});
