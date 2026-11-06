import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Linking } from 'react-native';
import { List, Button, Text, Portal, Dialog, Snackbar, IconButton, ProgressBar, ActivityIndicator } from 'react-native-paper';
import dayjs from 'dayjs';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import {
  isDriveConfigured,
  useDriveConnect,
  uploadBackupToDrive,
  restoreFromDrive,
  disconnectDrive,
  changeDriveAccount,
  getDriveStorage,
  isDriveScopeError,
  type DriveStorage,
} from '@/src/utils/googleDrive';
import { formatBytes } from '@/src/utils/formatters';
import { trackError } from '@/src/utils/analytics';
import { makeStyles, useColors } from '@/src/theme';
import i18n from '@/src/i18n';

// Google's own page for seeing what uses the space and buying more.
const GOOGLE_STORAGE_URL = 'https://one.google.com/storage';

// Drive answers 403 storageQuotaExceeded when the Google account is full, and
// 403 insufficient scopes when Drive access was never allowed (Drive is then
// disconnected by googleDrive.ts and the owner is asked to connect again).
const errorMessage = (e: unknown) => {
  if (isDriveScopeError(e)) return i18n.t('drive.scope_lost');
  return i18n.t(/storageQuotaExceeded|storage quota/i.test(String((e as Error)?.message)) ? 'drive.storage_full' : 'drive.error');
};

/** Scope errors are already tracked as drive_scope_lost; everything else is a real error. */
const reportError = (where: string, e: unknown) => {
  if (!isDriveScopeError(e)) trackError(where, e);
};

/**
 * Settings → Backup: Google Drive automatic backup. Shows nothing until the
 * OAuth client is configured, so the manual file backup below it stays the
 * only option in unconfigured builds.
 */
export function DriveBackupSection() {
  const styles = useStyles();
  const colors = useColors();
  const { driveEmail, driveLastBackupAt } = useSettingsStore();
  const { connect, busy: connecting } = useDriveConnect('settings');
  const { connect: connectOther } = useDriveConnect('settings', { selectAccount: true });
  const [working, setWorking] = useState<'backup' | 'restore' | 'disconnect' | 'change' | null>(null);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [message, setMessage] = useState('');
  const [storage, setStorage] = useState<DriveStorage | null>(null);
  const [storageState, setStorageState] = useState<'loading' | 'ready' | 'error'>('loading');

  const loadStorage = useCallback(async () => {
    if (!driveEmail) return;
    setStorageState('loading');
    try {
      const s = await getDriveStorage();
      setStorage(s);
      setStorageState(s ? 'ready' : 'error');
    } catch (e) {
      reportError('drive_storage', e);
      setStorageState('error');
    }
  }, [driveEmail]);

  useEffect(() => {
    if (isDriveConfigured()) loadStorage();
  }, [loadStorage]);

  if (!isDriveConfigured()) return null;

  const storageFull = !!storage?.limit && storage.usage >= storage.limit;

  const handleConnect = async () => {
    const ok = await connect();
    if (!ok) return;
    setWorking('backup');
    try {
      await uploadBackupToDrive(false);
      setMessage(i18n.t('drive.backup_done'));
    } catch (e) {
      reportError('drive_backup', e);
      setMessage(errorMessage(e));
    }
    setWorking(null);
  };

  const handleBackupNow = async () => {
    setWorking('backup');
    try {
      const result = await uploadBackupToDrive(false);
      setMessage(i18n.t(result === 'uploaded' ? 'drive.backup_done' : 'drive.error'));
    } catch (e) {
      reportError('drive_backup', e);
      setMessage(errorMessage(e));
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
      reportError('drive_restore', e);
      setMessage(errorMessage(e));
    }
    setWorking(null);
  };

  const handleChangeAccount = async () => {
    setWorking('change');
    try {
      const ok = await changeDriveAccount(connectOther);
      if (ok) {
        const result = await uploadBackupToDrive(false);
        setMessage(i18n.t(result === 'uploaded' ? 'drive.backup_done' : 'drive.error'));
      }
    } catch (e) {
      reportError('drive_change_account', e);
      setMessage(errorMessage(e));
    }
    setWorking(null);
  };

  const handleDisconnect = async () => {
    setConfirmDisconnect(false);
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
          <View style={styles.card}>
            <List.Item
              title={i18n.t('drive.title_short')}
              titleStyle={styles.cardTitle}
              description={() => (
                <View>
                  {storageFull ? (
                    <View style={styles.statusRow}>
                      <List.Icon icon="alert-circle-outline" color={colors.error} style={styles.statusIcon} />
                      <Text variant="bodyMedium" style={styles.errorText}>{i18n.t('drive.storage_full_paused')}</Text>
                    </View>
                  ) : (
                    <View style={styles.statusRow}>
                      <List.Icon icon="check-circle-outline" color={colors.textSecondary} style={styles.statusIcon} />
                      <Text variant="bodyMedium" style={styles.muted}>{i18n.t('drive.auto_on')}</Text>
                    </View>
                  )}
                  <Text variant="bodySmall" style={styles.muted}>{lastBackup}</Text>
                </View>
              )}
              left={(props) => (
                <List.Icon
                  {...props}
                  icon={storageFull ? 'cloud-alert' : 'cloud-check-outline'}
                  color={storageFull ? colors.error : colors.present}
                />
              )}
            />
          </View>

          <Text variant="titleSmall" style={styles.sectionLabel}>{i18n.t('drive.settings_title')}</Text>
          <View style={styles.card}>
            <List.Item
              title={i18n.t('drive.account')}
              description={driveEmail}
              left={(props) => <List.Icon {...props} icon="email-outline" />}
              right={() =>
                working === 'change' ? (
                  <ActivityIndicator style={styles.rowSpinner} />
                ) : (
                  <IconButton
                    icon="pencil"
                    iconColor={colors.primary}
                    onPress={handleChangeAccount}
                    disabled={!!working}
                    accessibilityLabel={i18n.t('drive.change_account')}
                  />
                )
              }
            />
            <View style={styles.rowDivider} />
            <Text variant="bodySmall" style={styles.note}>{i18n.t('drive.change_note')}</Text>
            <View style={styles.rowDivider} />
            <List.Item
              title={i18n.t('drive.storage')}
              onPress={() => Linking.openURL(GOOGLE_STORAGE_URL)}
              description={() => (
                <View style={styles.storage}>
                  {storageState === 'ready' && storage ? (
                    <>
                      {storage.limit ? (
                        <ProgressBar
                          progress={Math.min(storage.usage / storage.limit, 1)}
                          color={storage.usage / storage.limit > 0.9 ? colors.error : colors.present}
                          style={styles.bar}
                        />
                      ) : null}
                      <Text variant="bodySmall" style={styles.muted}>
                        {storage.limit
                          ? i18n.t('drive.storage_used', { used: formatBytes(storage.usage), total: formatBytes(storage.limit) })
                          : i18n.t('drive.storage_used_unlimited', { used: formatBytes(storage.usage) })}
                      </Text>
                    </>
                  ) : (
                    <Text variant="bodySmall" style={styles.muted} onPress={storageState === 'error' ? loadStorage : undefined}>
                      {i18n.t(storageState === 'error' ? 'drive.storage_error' : 'common.loading')}
                    </Text>
                  )}
                </View>
              )}
              left={(props) => <List.Icon {...props} icon="cloud-upload-outline" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
            />
            <View style={styles.rowDivider} />
            <List.Item
              title={i18n.t('drive.backup_now')}
              onPress={working ? undefined : handleBackupNow}
              left={(props) => <List.Icon {...props} icon="cloud-sync-outline" />}
              right={(props) => working === 'backup' ? <ActivityIndicator style={styles.rowSpinner} /> : <List.Icon {...props} icon="chevron-right" />}
            />
            <View style={styles.rowDivider} />
            <List.Item
              title={i18n.t('drive.restore')}
              onPress={working ? undefined : () => setConfirmRestore(true)}
              left={(props) => <List.Icon {...props} icon="cloud-download-outline" />}
              right={(props) => working === 'restore' ? <ActivityIndicator style={styles.rowSpinner} /> : <List.Icon {...props} icon="chevron-right" />}
            />
            <View style={styles.rowDivider} />
            <List.Item
              title={i18n.t('drive.disconnect')}
              titleStyle={{ color: colors.error }}
              onPress={working ? undefined : () => setConfirmDisconnect(true)}
              left={(props) => <List.Icon {...props} icon="cloud-off-outline" color={colors.error} />}
              right={(props) => working === 'disconnect' ? <ActivityIndicator style={styles.rowSpinner} /> : <List.Icon {...props} icon="chevron-right" />}
            />
          </View>
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
        <Dialog visible={confirmDisconnect} onDismiss={() => setConfirmDisconnect(false)}>
          <Dialog.Title>{i18n.t('drive.disconnect')}</Dialog.Title>
          <Dialog.Content>
            <Text>{i18n.t('drive.disconnect_confirm')}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmDisconnect(false)}>{i18n.t('common.cancel')}</Button>
            <Button onPress={handleDisconnect} textColor={colors.error}>{i18n.t('common.confirm')}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      <Snackbar visible={!!message} onDismiss={() => setMessage('')} duration={3000}>
        {message}
      </Snackbar>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  actions: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 4 },
  button: { flex: 1 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardTitle: { fontSize: 18 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  statusIcon: { margin: 0, marginRight: 4, transform: [{ scale: 0.7 }] },
  muted: { color: colors.textSecondary },
  errorText: { color: colors.error, flexShrink: 1 },
  sectionLabel: { marginHorizontal: 20, marginTop: 4, marginBottom: 8, color: colors.textSecondary },
  rowDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  note: { color: colors.textSecondary, paddingHorizontal: 16, paddingVertical: 10 },
  storage: { marginTop: 6, gap: 6 },
  bar: { height: 6, borderRadius: 3, backgroundColor: colors.divider },
  rowSpinner: { marginRight: 12 },
}));
