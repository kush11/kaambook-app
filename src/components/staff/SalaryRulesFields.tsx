import React, { useState } from 'react';
import { View } from 'react-native';
import { TextInput, Text } from 'react-native-paper';
import { SegmentedToggle } from '../ui/SegmentedToggle';
import { AmountInput } from '../ui/AmountInput';
import { makeStyles } from '@/src/theme';
import type { SalaryType } from '@/src/types';
import i18n from '@/src/i18n';

export interface SalaryRules {
  salaryType: SalaryType;
  salaryAmount: number;
  overtimeRate: number;
  shiftHours: number;
  lateFine: number;
}

interface Props {
  value: SalaryRules;
  onChange: (next: SalaryRules) => void;
  salaryError?: boolean;
}

/**
 * Salary type, pay, working hours, overtime and late fine — shared by the add/edit staff
 * form and the Edit Salary screen so both stay in step.
 */
export function SalaryRulesFields({ value, onChange, salaryError }: Props) {
  const styles = useStyles();
  const set = (patch: Partial<SalaryRules>) => onChange({ ...value, ...patch });
  const [hoursText, setHoursText] = useState(value.shiftHours ? String(value.shiftHours) : '8');
  const hourly = value.salaryType === 'hourly';

  return (
    <View style={styles.container}>
      <Text variant="labelLarge" style={styles.label}>{i18n.t('staff.salary_type')}</Text>
      <SegmentedToggle
        value={value.salaryType}
        onValueChange={(v) => set({ salaryType: v as SalaryType })}
        options={[
          { value: 'monthly', label: i18n.t('staff.monthly') },
          { value: 'daily', label: i18n.t('staff.daily') },
          { value: 'weekly', label: i18n.t('staff.weekly') },
          { value: 'hourly', label: i18n.t('staff.hourly') },
        ]}
        style={styles.field}
      />

      <AmountInput
        value={value.salaryAmount}
        onChangeValue={(v) => set({ salaryAmount: v })}
        label={hourly ? i18n.t('staff.pay_per_hour') : i18n.t('staff.salary_amount')}
        error={salaryError}
      />

      {hourly && (
        <>
          <TextInput
            mode="outlined"
            label={i18n.t('staff.shift_hours')}
            value={hoursText}
            keyboardType="decimal-pad"
            onChangeText={(t) => {
              const cleaned = t.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1').slice(0, 4);
              setHoursText(cleaned);
              const n = Number(cleaned);
              if (n > 0 && n <= 24) set({ shiftHours: n });
            }}
          />
          <Text style={styles.hint}>{i18n.t('staff.shift_hours_hint')}</Text>
        </>
      )}

      <AmountInput
        value={value.overtimeRate}
        onChangeValue={(v) => set({ overtimeRate: v })}
        label={i18n.t('staff.overtime_rate')}
      />

      <AmountInput
        value={value.lateFine}
        onChangeValue={(v) => set({ lateFine: v })}
        label={i18n.t('staff.late_fine')}
      />
      <Text style={styles.hint}>{i18n.t('staff.late_fine_hint')}</Text>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  container: { gap: 10 },
  label: { color: colors.textSecondary },
  field: { marginBottom: 6 },
  hint: { color: colors.textSecondary, fontSize: 12, marginTop: -6, marginLeft: 4 },
}));
