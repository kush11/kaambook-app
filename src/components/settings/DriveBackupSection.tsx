import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { List, Button, Text, Portal, Dialog, Snackbar } from 'react-native-paper';
import dayjs from 'dayjs';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import {
  isDriveConfigured,
  useDriveConnect,
  uploadBackupToDrive,
  restoreFromDrive,
  disconnectDrive,
} from '@/src/utils/googleDrive';
import { trackError } from '@/src/utils/analytics';
import { colors } from '@/src/theme/colors';
import i18n from '@/src/i18n';

/**
 * Settings → Backup: Google Drive automatic backup. Shows nothing until the
 * OAuth client is configured, so the manual file backup below it stays the
 * only option in unconfigured builds.
 */
export function DriveBackupSection() {
  const { driveEmail, driveLastBackupAt } = useSettingsStore();
  const { connect, busy: connecting } = useDriveConnect('settings');
  const [working, setWorking] = useState<'backup' | 'restore' | 'disconnect' | null>(null);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [message, setMessage] = useState('');

  if (!isDriveConfigured()) return null;

  const handleConnect = async () => {
    const ok = await connect();
    if (!ok) return;
    setWorking('backup');
    try {
      await uploadBackupToDrive(false);
      setMessage(i18n.t('drive.backup_done'));
    } catch (e) {
      trackError('drive_backup', e);
      setMessage(i18n.t('drive.error'));
    }
    setWorking(null);
  };

  const handleBackupNow = async () => {
    setWorking('backup');
    try {
      const result = await uploadBackupToDrive(false);
      setMessage(i18n.t(result === 'uploaded' ? 'drive.backup_done' : 'drive.error'));
    } catch (e) {
      trackError('drive_backup', e);
      setMessage(i18n.t('drive.error'));
    }
    setWorking(null);
  };

  const handleRestore = async () => {
    setConfirmRestore(false);
    setWorking('restore');
    try {
      const result = await restoreFromDrive();
      setMessage(i18n.t(result === 'restored' ? 'drive.restore_done' : result === 'none' ? 'drive.restore_none' : 'drive.error'));
    } catch (e) {
      trackError('drive_restore', e);
      setMessage(i18n.t('drive.error'));
    }
    setWorking(null);
  };

  const handleDisconnect = async () => {
    setWorking('disconnect');
    await disconnectDrive();
    setWorking(null);
  };

  const lastBackup = driveLastBackupAt
    ? i18n.t('drive.last_backup', { time: dayjs(driveLastBackupAt).format('D MMM, h:mm A') })
    : i18n.t('drive.never');

  return (
    <View>
      {driveEmail ? (
        <>
          <List.Item
            title={i18n.t('drive.on')}
            description={`${i18n.t('drive.connected_as', { email: driveEmail })}\n${lastBackup}`}
            descriptionNumberOfLines={3}
            left={(props) => <List.Icon {...props} icon="cloud-check" color={colors.present} />}
          />
          <View style={styles.actions}>
            <Button
              mode="outlined"
              icon="cloud-upload"
              onPress={handleBackupNow}
              loading={working === 'backup'}
              disabled={!!working}
              style={styles.button}
            >
              {i18n.t('drive.backup_now')}
            </Button>
            <Button
              mode="outlined"
              icon="cloud-download"
              onPress={() => setConfirmRestore(true)}
              loading={working === 'restore'}
              disabled={!!working}
              style={styles.button}
            >
              {i18n.t('drive.restore')}
            </Button>
          </View>
          <Button
            mode="text"
            onPress={handleDisconnect}
            loading={working === 'disconnect'}
            disabled={!!working}
            textColor={colors.textSecondary}
            style={styles.disconnect}
          >
            {i18n.t('drive.disconnect')}
          </Button>
        </>
      ) : (
        <>
          <List.Item
            title={i18n.t('drive.promo_title')}
            description={i18n.t('drive.promo_subtitle')}
            descriptionNumberOfLines={4}
            left={(props) => <List.Icon {...props} icon="google-drive" color={colors.primary} />}
          />
          <View style={styles.actions}>
            <Button
              mode="contained"
              icon="google"
              onPress={handleConnect}
              loading={connecting || working === 'backup'}
              disabled={connecting || !!working}
              style={styles.button}
            >
              {i18n.t('drive.connect')}
            </Button>
          </View>
        </>
      )}

      <Portal>
        <Dialog visible={confirmRestore} onDismiss={() => setConfirmRestore(false)}>
          <Dialog.Title>{i18n.t('drive.restore')}</Dialog.Title>
          <Dialog.Content>
            <Text>{i18n.t('drive.restore_confirm')}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmRestore(false)}>{i18n.t('common.cancel')}</Button>
            <Button onPress={handleRestore}>{i18n.t('common.confirm')}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      <Snackbar visible={!!message} onDismiss={() => setMessage('')} duration={3000}>
        {message}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 4 },
  button: { flex: 1 },
  disconnect: { alignSelf: 'flex-end', marginRight: 8 },
});
