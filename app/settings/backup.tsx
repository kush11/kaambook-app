import React from 'react';
import { ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { DriveBackupSection } from '@/src/components/settings/DriveBackupSection';
import { BackupRestore } from '@/src/components/settings/BackupRestore';
import { SettingsGroup } from '@/src/components/settings/SettingsGroup';
import { makeStyles } from '@/src/theme';
import i18n from '@/src/i18n';

/** Google Drive automatic backup, plus the older "share a backup file" option. */
export default function BackupScreen() {
  const styles = useStyles();
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: i18n.t('settings.backup_restore') }} />
      <DriveBackupSection />
      <SettingsGroup title={i18n.t('settings.backup_file')}>
        <BackupRestore />
      </SettingsGroup>
    </ScrollView>
  );
}

const useStyles = makeStyles((colors) => ({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 24 },
}));
