import React from 'react';
import { ScrollView, Platform, Linking } from 'react-native';
import { List, Switch, Text } from 'react-native-paper';
import { Stack } from 'expo-router';
import { SettingsGroup } from '@/src/components/settings/SettingsGroup';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { setAppCheckEnabled } from '@/src/utils/installedApps';
import { makeStyles, useColors } from '@/src/theme';
import i18n from '@/src/i18n';

const PRIVACY_POLICY_URL = 'https://kush11.github.io/kaambook-app/privacy-policy.html';

/**
 * Where the owner can withdraw consent for the installed-app check (Play requires a way
 * to turn it off) and read the privacy policy. The exact app list is in the one-time
 * consent dialog and the policy, so it is not repeated here.
 */
export default function PrivacyScreen() {
  const styles = useStyles();
  const colors = useColors();
  const appCheckConsent = useSettingsStore((s) => s.appCheckConsent);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: i18n.t('settings.privacy') }} />
      {Platform.OS === 'android' && (
        <>
          <SettingsGroup>
            <List.Item
              title={i18n.t('app_check.settings_title')}
              description={i18n.t('app_check.settings_desc')}
              descriptionNumberOfLines={3}
              left={(props) => <List.Icon {...props} icon="apps" color={colors.primary} />}
              right={() => (
                <Switch
                  value={appCheckConsent === 'granted'}
                  onValueChange={(on) => setAppCheckEnabled(on)}
                  color={colors.primary}
                  style={styles.switch}
                />
              )}
            />
          </SettingsGroup>
          <Text variant="bodySmall" style={styles.note}>{i18n.t('app_check.settings_note')}</Text>
        </>
      )}
      <SettingsGroup>
        <List.Item
          title={i18n.t('settings.privacy_policy')}
          left={(props) => <List.Icon {...props} icon="file-document-outline" color={colors.primary} />}
          right={(props) => <List.Icon {...props} icon="open-in-new" />}
          onPress={() => Linking.openURL(PRIVACY_POLICY_URL).catch(() => {})}
        />
      </SettingsGroup>
    </ScrollView>
  );
}

const useStyles = makeStyles((colors) => ({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 24 },
  switch: { alignSelf: 'center' },
  note: { color: colors.textSecondary, marginHorizontal: 20, marginTop: 8 },
}));
