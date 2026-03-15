import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, SegmentedButtons, Text, Chip } from 'react-native-paper';
import { AmountInput } from '../ui/AmountInput';
import { colors } from '@/src/theme/colors';
import type { SalaryType } from '@/src/types';
import i18n from '@/src/i18n';

interface StaffFormData {
  name: string;
  phone: string;
  salaryType: SalaryType;
  salaryAmount: number;
  overtimeRate: number;
  weekOff: number;
}

interface StaffFormProps {
  initialData?: Partial<StaffFormData>;
  onSubmit: (data: StaffFormData) => void;
  submitLabel?: string;
  isLoading?: boolean;
}

const DAYS = [
  { value: '-1', label: 'None' },
  { value: '0', label: 'Sun' },
  { value: '1', label: 'Mon' },
  { value: '2', label: 'Tue' },
  { value: '3', label: 'Wed' },
  { value: '4', label: 'Thu' },
  { value: '5', label: 'Fri' },
  { value: '6', label: 'Sat' },
];

export function StaffForm({ initialData, onSubmit, submitLabel = 'Save', isLoading }: StaffFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [salaryType, setSalaryType] = useState<SalaryType>(initialData?.salaryType || 'monthly');
  const [salaryAmount, setSalaryAmount] = useState(initialData?.salaryAmount || 0);
  const [overtimeRate, setOvertimeRate] = useState(initialData?.overtimeRate || 0);
  const [weekOff, setWeekOff] = useState(String(initialData?.weekOff ?? -1));
  const [nameError, setNameError] = useState(false);

  const handleSubmit = () => {
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    onSubmit({
      name: name.trim(),
      phone: phone.trim(),
      salaryType,
      salaryAmount,
      overtimeRate,
      weekOff: Number(weekOff),
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <TextInput
        mode="outlined"
        label={i18n.t('staff.name')}
        value={name}
        onChangeText={(t) => { setName(t); setNameError(false); }}
        error={nameError}
        style={styles.input}
      />

      <TextInput
        mode="outlined"
        label={i18n.t('staff.phone')}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        style={styles.input}
      />

      <Text variant="labelLarge" style={styles.label}>{i18n.t('staff.salary_type')}</Text>
      <SegmentedButtons
        value={salaryType}
        onValueChange={(v) => setSalaryType(v as SalaryType)}
        buttons={[
          { value: 'monthly', label: i18n.t('staff.monthly') },
          { value: 'daily', label: i18n.t('staff.daily') },
          { value: 'weekly', label: i18n.t('staff.weekly') },
        ]}
        style={styles.input}
      />

      <AmountInput
        value={salaryAmount}
        onChangeValue={setSalaryAmount}
        label={i18n.t('staff.salary_amount')}
      />

      <AmountInput
        value={overtimeRate}
        onChangeValue={setOvertimeRate}
        label="Overtime Rate (per hour)"
      />

      <Text variant="labelLarge" style={[styles.label, { marginTop: 16 }]}>{i18n.t('staff.week_off')}</Text>
      <View style={styles.chipRow}>
        {DAYS.slice(0, 4).map(d => (
          <Chip
            key={d.value}
            selected={weekOff === d.value}
            onPress={() => setWeekOff(d.value)}
            showSelectedCheck={false}
            style={[
              styles.chip,
              weekOff === d.value && styles.chipSelected,
            ]}
            textStyle={weekOff === d.value ? styles.chipTextSelected : undefined}
          >
            {d.label}
          </Chip>
        ))}
      </View>
      <View style={styles.chipRow}>
        {DAYS.slice(4).map(d => (
          <Chip
            key={d.value}
            selected={weekOff === d.value}
            onPress={() => setWeekOff(d.value)}
            showSelectedCheck={false}
            style={[
              styles.chip,
              weekOff === d.value && styles.chipSelected,
            ]}
            textStyle={weekOff === d.value ? styles.chipTextSelected : undefined}
          >
            {d.label}
          </Chip>
        ))}
      </View>

      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={isLoading}
        style={styles.button}
        contentStyle={styles.buttonContent}
      >
        {submitLabel}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 16 },
  input: { marginBottom: 16 },
  label: { marginBottom: 8, color: colors.textSecondary },
  chipRow: { flexDirection: 'row', marginBottom: 8 },
  chip: { marginRight: 8, backgroundColor: colors.surfaceVariant },
  chipSelected: { backgroundColor: colors.primary },
  chipTextSelected: { color: '#fff' },
  button: { marginTop: 24 },
  buttonContent: { paddingVertical: 6 },
});
