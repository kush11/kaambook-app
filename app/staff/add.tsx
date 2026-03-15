import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { StaffForm } from '@/src/components/staff/StaffForm';
import { useStaffStore } from '@/src/stores/useStaffStore';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { colors } from '@/src/theme/colors';

export default function AddStaffScreen() {
  const { addStaff } = useStaffStore();
  const { activeBusinessId } = useSettingsStore();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    const id = await addStaff(activeBusinessId, data);
    setLoading(false);
    router.back();
  };

  return (
    <View style={styles.container}>
      <StaffForm onSubmit={handleSubmit} isLoading={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});
