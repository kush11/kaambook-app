import React, { useState } from 'react';
import { View } from 'react-native';
import { Snackbar } from 'react-native-paper';
import { router } from 'expo-router';
import { StaffForm } from '@/src/components/staff/StaffForm';
import { useStaffStore } from '@/src/stores/useStaffStore';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { makeStyles } from '@/src/theme';
import i18n from '@/src/i18n';

export default function AddStaffScreen() {
  const styles = useStyles();
  const { addStaff, isPhoneTaken } = useStaffStore();
  const { activeBusinessId, autoEnableReminder } = useSettingsStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (data: any) => {
    if (!activeBusinessId) {
      setError(i18n.t('home.no_business'));
      return;
    }
    setLoading(true);
    await addStaff(activeBusinessId, data);
    // First staff ever: ask for notification permission now, while the user is
    // invested, so tomorrow's attendance gets a nudge without a trip to Settings.
    if (useStaffStore.getState().staffList.length === 1) {
      await autoEnableReminder('first_staff');
    }
    setLoading(false);
    router.back();
  };

  return (
    <View style={styles.container}>
      <StaffForm onSubmit={handleSubmit} isLoading={loading} isPhoneTaken={(phone) => isPhoneTaken(phone)} />
      <Snackbar visible={!!error} onDismiss={() => setError('')} duration={3000}>
        {error}
      </Snackbar>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  container: { flex: 1, backgroundColor: colors.background },
}));
