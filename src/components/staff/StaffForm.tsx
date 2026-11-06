import React, { useState } from 'react';
import { View, ScrollView, Alert, Linking } from 'react-native';
import { TextInput, Button, Text, Chip, HelperText } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SalaryRulesFields, type SalaryRules } from './SalaryRulesFields';
import { DatePickerField } from '../ui/DatePickerField';
import { makeStyles } from '@/src/theme';
import type { SalaryType } from '@/src/types';
import i18n from '@/src/i18n';
import * as Contacts from 'expo-contacts';
import dayjs from 'dayjs';
import { track, trackError } from '@/src/utils/analytics';
import { isValidUpiId } from '@/src/utils/upi';

interface StaffFormData {
  name: string;
  phone: string;
  salaryType: SalaryType;
  salaryAmount: number;
  overtimeRate: number;
  shiftHours: number;
  lateFine: number;
  upiId: string;
  weekOffDays: number[];
  joiningDate: string; // YYYY-MM-DD
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
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(initialData?.name || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [rules, setRules] = useState<SalaryRules>({
    salaryType: initialData?.salaryType || 'monthly',
    salaryAmount: initialData?.salaryAmount || 0,
    overtimeRate: initialData?.overtimeRate || 0,
    shiftHours: initialData?.shiftHours || 8,
    lateFine: initialData?.lateFine || 0,
  });
  const [upiId, setUpiId] = useState(initialData?.upiId || '');
  const [upiError, setUpiError] = useState(false);
  const [weekOffDays, setWeekOffDays] = useState<number[]>(initialData?.weekOffDays ?? []);
  const [joiningDate, setJoiningDate] = useState(initialData?.joiningDate || dayjs().format('YYYY-MM-DD'));
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
    if (!rules.salaryAmount || rules.salaryAmount <= 0) { setSalaryError(true); hasError = true; }
    if (upiId.trim() && !isValidUpiId(upiId.trim())) { setUpiError(true); hasError = true; }
    if (phone.trim() && isPhoneTaken?.(phone.trim())) { setPhoneError(true); hasError = true; }
    if (hasError) return;
    onSubmit({
      name: name.trim(),
      phone: phone.trim(),
      ...rules,
      upiId: upiId.trim(),
      weekOffDays: [...weekOffDays].sort((a, b) => a - b),
      joiningDate,
    });
  };

  return (
    // Edge-to-edge: pad by the gesture bar so Save isn't half under it.
    <ScrollView style={styles.container} contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 16 }]}>
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

      <DatePickerField
        value={joiningDate}
        onChange={setJoiningDate}
        label={i18n.t('staff.joining_date')}
      />
      <Text style={[styles.hint, styles.joiningHint]}>{i18n.t('staff.joining_date_hint')}</Text>

      <SalaryRulesFields
        value={rules}
        onChange={(next) => { setRules(next); if (next.salaryAmount > 0) setSalaryError(false); }}
        salaryError={salaryError}
      />

      <TextInput
        mode="outlined"
        label={i18n.t('staff.upi_id')}
        value={upiId}
        onChangeText={(t) => { setUpiId(t.replace(/\s/g, '')); setUpiError(false); }}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        error={upiError}
        style={styles.upiInput}
      />
      <HelperText type={upiError ? 'error' : 'info'} style={styles.phoneHelper}>
        {upiError ? i18n.t('staff.upi_invalid') : i18n.t('staff.upi_id_hint')}
      </HelperText>

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

const useStyles = makeStyles((colors) => ({
  container: { flex: 1 },
  contentContainer: { padding: 16 },
  pickContactBtn: { marginBottom: 16 },
  input: { marginBottom: 16 },
  inputNoMargin: { marginBottom: 0 },
  phoneHelper: { marginBottom: 8 },
  upiInput: { marginTop: 16 },
  label: { marginBottom: 8, color: colors.textSecondary },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  hint: { fontSize: 12, color: colors.textSecondary, marginBottom: 8 },
  joiningHint: { marginTop: 4, marginBottom: 16 },
  chip: { marginRight: 8, marginBottom: 8, backgroundColor: colors.surfaceVariant },
  chipSelected: { backgroundColor: colors.primary },
  chipTextSelected: { color: '#fff' },
  button: { marginTop: 24 },
  buttonContent: { paddingVertical: 6 },
}));
