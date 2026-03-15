import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StaffForm } from '@/src/components/staff/StaffForm';
import { useStaffStore } from '@/src/stores/useStaffStore';
import { colors } from '@/src/theme/colors';
import i18n from '@/src/i18n';

export default function ProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getStaffById, updateStaff } = useStaffStore();
  const [loading, setLoading] = useState(false);
  const staffMember = getStaffById(id);

  if (!staffMember) return null;

  const handleSubmit = async (data: any) => {
    setLoading(true);
    await updateStaff(id, {
      name: data.name,
      phone: data.phone || null,
      salaryType: data.salaryType,
      salaryAmount: data.salaryAmount,
      weekOff: data.weekOff,
    });
    setLoading(false);
    router.back();
  };

  return (
    <View style={styles.container}>
      <StaffForm
        initialData={{
          name: staffMember.name,
          phone: staffMember.phone || '',
          salaryType: staffMember.salaryType,
          salaryAmount: staffMember.salaryAmount,
          weekOff: staffMember.weekOff,
        }}
        onSubmit={handleSubmit}
        submitLabel={i18n.t('common.save')}
        isLoading={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});
