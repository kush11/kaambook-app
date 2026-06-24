import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, SegmentedButtons, Text, Chip } from 'react-native-paper';
import { AmountInput } from '../ui/AmountInput';
import { colors } from '@/src/theme/colors';
import type { SalaryType } from '@/src/types';
import i18n from '@/src/i18n';
import * as Contacts from 'expo-contacts';

interface StaffFormData {
  name: string;
  phone: string;
  salaryType: SalaryType;
  salaryAmount: number;
  overtimeRate: number;
  weekOffDays: number[];
}

interface StaffFormProps {
  initialData?: Partial<StaffFormData>;
  onSubmit: (data: StaffFormData) => void;
  submitLabel?: string;
  isLoading?: boolean;
}

const DAY_OPTIONS = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

export function StaffForm({ initialData, onSubmit, submitLabel = 'Save', isLoading }: StaffFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [salaryType, setSalaryType] = useState<SalaryType>(initialData?.salaryType || 'monthly');
  const [salaryAmount, setSalaryAmount] = useState(initialData?.salaryAmount || 0);
  const [overtimeRate, setOvertimeRate] = useState(initialData?.overtimeRate || 0);
  const [weekOffDays, setWeekOffDays] = useState<number[]>(initialData?.weekOffDays ?? []);
  const [nameError, setNameError] = useState(false);
  const [salaryError, setSalaryError] = useState(false);

  const toggleDay = (day: number) => {
    setWeekOffDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handlePickContact = async () => {
    try {
      const contact = await Contacts.presentContactPickerAsync();
      if (!contact) return;
      if (contact.name) { setName(contact.name); setNameError(false); }
      const num = contact.phoneNumbers?.[0]?.number;
      if (num) setPhone(num.replace(/[^0-9]/g, '').slice(-10)); // keep last 10 digits
    } catch {
      // picker dismissed or unavailable
    }
  };

  const handleSubmit = () => {
    let hasError = false;
    if (!name.trim()) { setNameError(true); hasError = true; }
    if (!salaryAmount || salaryAmount <= 0) { setSalaryError(true); hasError = true; }
    if (hasError) return;
    onSubmit({
      name: name.trim(),
      phone: phone.trim(),
      salaryType,
      salaryAmount,
      overtimeRate,
      weekOffDays: [...weekOffDays].sort((a, b) => a - b),
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Button
        mode="contained-tonal"
        icon="account-box-multiple-outline"
        onPress={handlePickContact}
        style={styles.pickContactBtn}
      >
        {i18n.t('staff.pick_contact')}
      </Button>

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
        onChangeText={(t) => setPhone(t.replace(/[^0-9]/g, '').slice(0, 10))}
        keyboardType="phone-pad"
        maxLength={10}
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
        theme={{ colors: { secondaryContainer: colors.primary, onSecondaryContainer: '#fff' } }}
      />

      <AmountInput
        value={salaryAmount}
        onChangeValue={(v) => { setSalaryAmount(v); setSalaryError(false); }}
        label={i18n.t('staff.salary_amount')}
        error={salaryError}
      />

      <AmountInput
        value={overtimeRate}
        onChangeValue={setOvertimeRate}
        label="Overtime Rate (per hour)"
      />

      <Text variant="labelLarge" style={[styles.label, { marginTop: 16 }]}>{i18n.t('staff.week_off')}</Text>
      <Text style={styles.hint}>{i18n.t('staff.week_off_hint')}</Text>
      <View style={styles.chipWrap}>
        <Chip
          selected={weekOffDays.length === 0}
          onPress={() => setWeekOffDays([])}
          showSelectedCheck={false}
          style={[styles.chip, weekOffDays.length === 0 && styles.chipSelected]}
          textStyle={weekOffDays.length === 0 ? styles.chipTextSelected : undefined}
        >
          {i18n.t('staff.none')}
        </Chip>
        {DAY_OPTIONS.map((d) => {
          const sel = weekOffDays.includes(d.value);
          return (
            <Chip
              key={d.value}
              selected={sel}
              onPress={() => toggleDay(d.value)}
              showSelectedCheck={false}
              style={[styles.chip, sel && styles.chipSelected]}
              textStyle={sel ? styles.chipTextSelected : undefined}
            >
              {d.label}
            </Chip>
          );
        })}
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
  pickContactBtn: { marginBottom: 16 },
  input: { marginBottom: 16 },
  label: { marginBottom: 8, color: colors.textSecondary },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  hint: { fontSize: 12, color: colors.textSecondary, marginBottom: 8 },
  chip: { marginRight: 8, marginBottom: 8, backgroundColor: colors.surfaceVariant },
  chipSelected: { backgroundColor: colors.primary },
  chipTextSelected: { color: '#fff' },
  button: { marginTop: 24 },
  buttonContent: { paddingVertical: 6 },
});
