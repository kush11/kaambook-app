import React, { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { router, Stack } from 'expo-router';
import { LanguagePicker } from '@/src/components/settings/LanguagePicker';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { colors } from '@/src/theme/colors';
import i18n from '@/src/i18n';

export default function LanguageScreen() {
  const { language, setLanguage } = useSettingsStore();
  // Frozen for as long as this screen is open. Picking a language closes the
  // screen right away, and react-native-screens crashes if the header title
  // changes while the screen is being removed.
  const [title] = useState(() => i18n.t('settings.language'));

  const handleChange = async (lang: string) => {
    await setLanguage(lang);
    router.back();
  };

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title }} />
      <LanguagePicker value={language} onChange={handleChange} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});
