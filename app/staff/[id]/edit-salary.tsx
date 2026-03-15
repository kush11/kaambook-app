import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SegmentedButtons, Text, Button } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { AmountInput } from '@/src/components/ui/AmountInput';
import { useStaffStore } from '@/src/stores/useStaffStore';
import { colors } from '@/src/theme/colors';
import type { SalaryType } from '@/src/types';
import i18n from '@/src/i18n';

export default function EditSalaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getStaffById, updateStaff } = useStaffStore();
  const staffMember = getStaffById(id);
  const [loading, setLoading] = useState(false);

  const [salaryType, setSalaryType] = useState<SalaryType>(staffMember?.salaryType || 'monthly');
  const [salaryAmount, setSalaryAmount] = useState(staffMember?.salaryAmount || 0);
  const [overtimeRate, setOvertimeRate] = useState(staffMember?.overtimeRate || 0);

  if (!staffMember) return null;

  const handleSave = async () => {
    setLoading(true);
    await updateStaff(id, { salaryType, salaryAmount, overtimeRate });
    setLoading(false);
    router.back();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="labelLarge" style={styles.label}>{i18n.t('staff.salary_type')}</Text>
      <SegmentedButtons
        value={salaryType}
        onValueChange={(v) => setSalaryType(v as SalaryType)}
        buttons={[
          { value: 'monthly', label: i18n.t('staff.monthly') },
          { value: 'daily', label: i18n.t('staff.daily') },
          { value: 'weekly', label: i18n.t('staff.weekly') },
        ]}
        style={styles.segment}
      />

      <AmountInput
        value={salaryAmount}
        onChangeValue={setSalaryAmount}
        label={i18n.t('staff.salary_amount')}
      />

      <AmountInput
        value={overtimeRate}
        onChangeValue={setOvertimeRate}
        label={i18n.t('staff.overtime_rate')}
      />

      <Button
        mode="contained"
        onPress={handleSave}
        loading={loading}
        style={styles.button}
        contentStyle={styles.buttonContent}
      >
        {i18n.t('common.save')}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16 },
  label: { marginBottom: 8, color: colors.textSecondary },
  segment: { marginBottom: 24 },
  button: { marginTop: 24 },
  buttonContent: { paddingVertical: 6 },
});
