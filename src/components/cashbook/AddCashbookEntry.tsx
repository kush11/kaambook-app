import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Button, SegmentedButtons, TextInput, Text, Chip } from 'react-native-paper';
import { AmountInput } from '../ui/AmountInput';
import { colors } from '@/src/theme/colors';
import type { CashbookType, CashbookCategory } from '@/src/types';
import i18n from '@/src/i18n';

interface Props {
  onSubmit: (data: { amount: number; type: CashbookType; category: CashbookCategory; description: string }) => void;
  isLoading?: boolean;
}

const EXPENSE_CATEGORIES: { value: CashbookCategory; labelKey: string }[] = [
  { value: 'wages', labelKey: 'cashbook.categories.wages' },
  { value: 'material', labelKey: 'cashbook.categories.material' },
  { value: 'transport', labelKey: 'cashbook.categories.transport' },
  { value: 'food', labelKey: 'cashbook.categories.food' },
  { value: 'rent', labelKey: 'cashbook.categories.rent' },
  { value: 'other', labelKey: 'cashbook.categories.other' },
];

const INCOME_CATEGORIES: { value: CashbookCategory; labelKey: string }[] = [
  { value: 'sales', labelKey: 'cashbook.categories.sales' },
  { value: 'payment_received', labelKey: 'cashbook.categories.payment_received' },
  { value: 'other_income', labelKey: 'cashbook.categories.other_income' },
];

export function AddCashbookEntry({ onSubmit, isLoading }: Props) {
  const [amount, setAmount] = useState(0);
  const [type, setType] = useState<CashbookType>('expense');
  const [category, setCategory] = useState<CashbookCategory>('material');
  const [description, setDescription] = useState('');
  const [error, setError] = useState(false);

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const handleTypeChange = (v: string) => {
    setType(v as CashbookType);
    setCategory(v === 'expense' ? 'material' : 'sales');
  };

  const handleSubmit = () => {
    if (amount <= 0) { setError(true); return; }
    onSubmit({ amount, type, category, description });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AmountInput
        value={amount}
        onChangeValue={(v) => { setAmount(v); setError(false); }}
        label={i18n.t('cashbook.amount')}
        error={error}
      />

      <Text variant="labelLarge" style={styles.label}>{i18n.t('cashbook.type')}</Text>
      <SegmentedButtons
        value={type}
        onValueChange={handleTypeChange}
        buttons={[
          { value: 'expense', label: i18n.t('cashbook.expense') },
          { value: 'income', label: i18n.t('cashbook.income') },
        ]}
        style={styles.segment}
      />

      <Text variant="labelLarge" style={styles.label}>{i18n.t('cashbook.category')}</Text>
      <View style={styles.chipRow}>
        {categories.map(c => (
          <Chip
            key={c.value}
            selected={category === c.value}
            onPress={() => setCategory(c.value)}
            showSelectedCheck={false}
            style={[styles.chip, category === c.value && styles.chipSelected]}
            textStyle={category === c.value ? styles.chipTextSelected : undefined}
          >
            {i18n.t(c.labelKey)}
          </Chip>
        ))}
      </View>

      <TextInput
        mode="outlined"
        label={i18n.t('cashbook.description_optional')}
        value={description}
        onChangeText={setDescription}
        style={styles.input}
      />

      <Button mode="contained" onPress={handleSubmit} loading={isLoading} style={styles.button} contentStyle={styles.buttonContent}>
        {i18n.t('cashbook.add_entry')}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 0 },
  content: { padding: 16 },
  label: { marginTop: 16, marginBottom: 8, color: colors.textSecondary },
  segment: { marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  chip: { marginRight: 8, marginBottom: 8, backgroundColor: colors.surfaceVariant },
  chipSelected: { backgroundColor: colors.primary },
  chipTextSelected: { color: '#fff' },
  input: { marginTop: 16 },
  button: { marginTop: 24 },
  buttonContent: { paddingVertical: 6 },
});
