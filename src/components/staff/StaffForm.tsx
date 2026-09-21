import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Linking } from 'react-native';
import { TextInput, Button, Text, Chip, HelperText } from 'react-native-paper';
import { SegmentedToggle } from '../ui/SegmentedToggle';
import { AmountInput } from '../ui/AmountInput';
import { colors } from '@/src/theme/colors';
import type { SalaryType } from '@/src/types';
import i18n from '@/src/i18n';
import * as Contacts from 'expo-contacts';
import { track, trackError } from '@/src/utils/analytics';

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
  /** Returns true if the given phone number already belongs to another staff member. */
  isPhoneTaken?: (phone: string) => boolean;
}

const DAY_OPTIONS = [
  { value: 0, labelKey: 'days.sun' },
  { value: 1, labelKey: 'days.mon' },
  { value: 2, labelKey: 'days.tue' },
  { value: 3, labelKey: 'days.wed' },
  { value: 4, labelKey: 'days.thu' },
  { value: 5, labelKey: 'days.fri' },
  { value: 6, labelKey: 'days.sat' },
];

export function StaffForm({ initialData, onSubmit, submitLabel = i18n.t('common.save'), isLoading, isPhoneTaken }: StaffFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [salaryType, setSalaryType] = useState<SalaryType>(initialData?.salaryType || 'monthly');
  const [salaryAmount, setSalaryAmount] = useState(initialData?.salaryAmount || 0);
  const [overtimeRate, setOvertimeRate] = useState(initialData?.overtimeRate || 0);
  const [weekOffDays, setWeekOffDays] = useState<number[]>(initialData?.weekOffDays ?? []);
  const [nameError, setNameError] = useState(false);
  const [salaryError, setSalaryError] = useState(false);
  const [phoneError, setPhoneError] = useState(false);

  const toggleDay = (day: number) => {
    setWeekOffDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handlePickContact = async () => {
    try {
      // Reading the picked contact's details requires READ_CONTACTS at runtime;
      // without it expo-contacts throws a SecurityException and crashes the app.
      const { status, canAskAgain } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        track('contact_permission_denied', { can_ask_again: canAskAgain });
        Alert.alert(
          i18n.t('staff.contact_permission_title'),
          i18n.t('staff.contact_permission_msg'),
          canAskAgain
            ? undefined
            : [
                { text: i18n.t('common.cancel'), style: 'cancel' },
                { text: i18n.t('common.open_settings'), onPress: () => Linking.openSettings() },
              ]
        );
        return;
      }
      const contact = await Contacts.presentContactPickerAsync();
      if (!contact) return;
      const pickedName =
        contact.name || [contact.firstName, contact.lastName].filter(Boolean).join(' ');
      if (pickedName) { setName(pickedName); setNameError(false); }
      const num = contact.phoneNumbers?.[0]?.number;
      if (num) { setPhone(num.replace(/[^0-9]/g, '').slice(-10)); setPhoneError(false); } // keep last 10 digits
      track('contact_picked', { has_phone: !!num });
    } catch (e) {
      // picker dismissed or unavailable
      trackError('contact_pick', e);
    }
  };

  const handleSubmit = () => {
    let hasError = false;
    if (!name.trim()) { setNameError(true); hasError = true; }
    if (!salaryAmount || salaryAmount <= 0) { setSalaryError(true); hasError = true; }
    if (phone.trim() && isPhoneTaken?.(phone.trim())) { setPhoneError(true); hasError = true; }
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
        mode="outlined"
        icon="account-box-multiple-outline"
        onPress={handlePickContact}
        style={styles.pickContactBtn}
        contentStyle={styles.buttonContent}
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
        onChangeText={(t) => { setPhone(t.replace(/[^0-9]/g, '').slice(0, 10)); setPhoneError(false); }}
        error={phoneError}
        keyboardType="phone-pad"
        maxLength={10}
        style={phoneError ? styles.inputNoMargin : styles.input}
      />
      {phoneError && (
        <HelperText type="error" style={styles.phoneHelper}>
          {i18n.t('staff.duplicate_phone')}
        </HelperText>
      )}

      <Text variant="labelLarge" style={styles.label}>{i18n.t('staff.salary_type')}</Text>
      <SegmentedToggle
        value={salaryType}
        onValueChange={(v) => setSalaryType(v as SalaryType)}
        options={[
          { value: 'monthly', label: i18n.t('staff.monthly') },
          { value: 'daily', label: i18n.t('staff.daily') },
          { value: 'weekly', label: i18n.t('staff.weekly') },
        ]}
        style={styles.input}
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
        label={i18n.t('staff.overtime_rate')}
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
              {i18n.t(d.labelKey)}
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
  inputNoMargin: { marginBottom: 0 },
  phoneHelper: { marginBottom: 8 },
  label: { marginBottom: 8, color: colors.textSecondary },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  hint: { fontSize: 12, color: colors.textSecondary, marginBottom: 8 },
  chip: { marginRight: 8, marginBottom: 8, backgroundColor: colors.surfaceVariant },
  chipSelected: { backgroundColor: colors.primary },
  chipTextSelected: { color: '#fff' },
  button: { marginTop: 24 },
  buttonContent: { paddingVertical: 6 },
});
