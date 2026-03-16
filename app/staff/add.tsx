import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Snackbar } from 'react-native-paper';
import { router } from 'expo-router';
import { StaffForm } from '@/src/components/staff/StaffForm';
import { useStaffStore } from '@/src/stores/useStaffStore';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { colors } from '@/src/theme/colors';
import i18n from '@/src/i18n';

export default function AddStaffScreen() {
  const { addStaff } = useStaffStore();
  const { activeBusinessId } = useSettingsStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (data: any) => {
    if (!activeBusinessId) {
      setError(i18n.t('home.no_business'));
      return;
    }
    setLoading(true);
    const id = await addStaff(activeBusinessId, data);
    setLoading(false);
    router.back();
  };

  return (
    <View style={styles.container}>
      <StaffForm onSubmit={handleSubmit} isLoading={loading} />
      <Snackbar visible={!!error} onDismiss={() => setError('')} duration={3000}>
        {error}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});
