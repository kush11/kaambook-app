import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { LanguagePicker } from '@/src/components/settings/LanguagePicker';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { colors } from '@/src/theme/colors';

export default function LanguageScreen() {
  const { language, setLanguage } = useSettingsStore();

  const handleChange = async (lang: string) => {
    await setLanguage(lang);
    router.back();
  };

  return (
    <ScrollView style={styles.container}>
      <LanguagePicker value={language} onChange={handleChange} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});
