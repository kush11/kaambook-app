import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StaffForm } from '@/src/components/staff/StaffForm';
import { useStaffStore } from '@/src/stores/useStaffStore';
import { colors } from '@/src/theme/colors';
import i18n from '@/src/i18n';

export default function ProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getStaffById, updateStaff, isPhoneTaken } = useStaffStore();
  const [loading, setLoading] = useState(false);
  const staffMember = getStaffById(id);

  if (!staffMember) return null;

  // Parse the staff member's week-off days (new list column, fall back to legacy single day).
  const initialWeekOffDays: number[] = staffMember.weekOffDays
    ? staffMember.weekOffDays.split(',').map(Number).filter((n) => !isNaN(n))
    : (staffMember.weekOff >= 0 ? [staffMember.weekOff] : []);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    await updateStaff(id, {
      name: data.name,
      phone: data.phone || null,
      salaryType: data.salaryType,
      salaryAmount: data.salaryAmount,
      weekOffDays: (data.weekOffDays as number[]).join(','),
      weekOff: (data.weekOffDays as number[])[0] ?? -1, // keep legacy column in sync
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
          weekOffDays: initialWeekOffDays,
        }}
        onSubmit={handleSubmit}
        submitLabel={i18n.t('common.save')}
        isLoading={loading}
        isPhoneTaken={(phone) => isPhoneTaken(phone, id)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});
