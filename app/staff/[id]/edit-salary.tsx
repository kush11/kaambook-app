import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { Button } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { SalaryRulesFields, type SalaryRules } from '@/src/components/staff/SalaryRulesFields';
import { useStaffStore } from '@/src/stores/useStaffStore';
import { makeStyles } from '@/src/theme';
import i18n from '@/src/i18n';

export default function EditSalaryScreen() {
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getStaffById, updateStaff } = useStaffStore();
  const staffMember = getStaffById(id);
  const [loading, setLoading] = useState(false);

  const [rules, setRules] = useState<SalaryRules>({
    salaryType: staffMember?.salaryType || 'monthly',
    salaryAmount: staffMember?.salaryAmount || 0,
    overtimeRate: staffMember?.overtimeRate || 0,
    shiftHours: staffMember?.shiftHours || 8,
    lateFine: staffMember?.lateFine || 0,
  });

  if (!staffMember) return null;

  const handleSave = async () => {
    setLoading(true);
    await updateStaff(id, rules);
    setLoading(false);
    router.back();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SalaryRulesFields value={rules} onChange={setRules} />

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

const useStyles = makeStyles((colors) => ({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16 },
  button: { marginTop: 24 },
  buttonContent: { paddingVertical: 6 },
}));
