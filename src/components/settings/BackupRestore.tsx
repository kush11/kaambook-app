import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text, Snackbar } from 'react-native-paper';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { createBackup, restoreBackup } from '@/src/utils/backup';
import { colors } from '@/src/theme/colors';
import i18n from '@/src/i18n';

export function BackupRestore() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const handleBackup = async () => {
    setLoading(true);
    try {
      await createBackup();
      setMessage(i18n.t('settings.backup_success'));
    } catch (e) {
      setMessage(i18n.t('common.error'));
    }
    setLoading(false);
  };

  const handleRestore = async () => {
    setShowConfirm(false);
    setLoading(true);
    try {
      const success = await restoreBackup();
      if (success) setMessage(i18n.t('settings.restore_success'));
    } catch (e) {
      setMessage(i18n.t('common.error'));
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Button
        mode="outlined"
        icon="cloud-upload"
        onPress={handleBackup}
        loading={loading}
        style={styles.button}
      >
        {i18n.t('settings.backup')}
      </Button>
      <Button
        mode="outlined"
        icon="cloud-download"
        onPress={() => setShowConfirm(true)}
        loading={loading}
        style={styles.button}
      >
        {i18n.t('settings.restore')}
      </Button>
      <ConfirmDialog
        visible={showConfirm}
        title={i18n.t('settings.restore')}
        message={i18n.t('settings.restore_confirm')}
        onConfirm={handleRestore}
        onDismiss={() => setShowConfirm(false)}
        destructive
      />
      <Snackbar visible={!!message} onDismiss={() => setMessage('')} duration={3000}>
        {message}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  button: { borderColor: colors.border },
});
