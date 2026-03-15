import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { router } from 'expo-router';
import { LanguagePicker } from '@/src/components/settings/LanguagePicker';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { colors } from '@/src/theme/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import i18n from '@/src/i18n';

export default function OnboardingScreen() {
  const { language, setLanguage, completeOnboarding } = useSettingsStore();
  const [selectedLang, setSelectedLang] = useState(language);

  const handleLanguageChange = async (lang: string) => {
    setSelectedLang(lang);
    await setLanguage(lang);
  };

  const handleGetStarted = async () => {
    await completeOnboarding();
    router.replace('/(tabs)/home');
  };

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <MaterialCommunityIcons name="book-open-page-variant" size={80} color={colors.primary} />
        <Text variant="headlineLarge" style={styles.title}>
          {i18n.t('onboarding.title')}
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          {i18n.t('onboarding.subtitle')}
        </Text>
      </View>

      <View style={styles.middle}>
        <Text variant="titleMedium" style={styles.langLabel}>
          {i18n.t('onboarding.select_language')}
        </Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          <LanguagePicker value={selectedLang} onChange={handleLanguageChange} />
        </ScrollView>
      </View>

      <Button
        mode="contained"
        onPress={handleGetStarted}
        style={styles.button}
        contentStyle={styles.buttonContent}
        labelStyle={styles.buttonLabel}
      >
        {i18n.t('onboarding.get_started')}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 24, justifyContent: 'space-between' },
  top: { alignItems: 'center', marginTop: 60 },
  title: { marginTop: 24, fontWeight: 'bold', color: colors.text, textAlign: 'center' },
  subtitle: { marginTop: 12, color: colors.textSecondary, textAlign: 'center' },
  middle: { flex: 1, marginTop: 24 },
  langLabel: { marginBottom: 16, color: colors.text },
  button: { marginBottom: 40 },
  buttonContent: { paddingVertical: 8 },
  buttonLabel: { fontSize: 16 },
});
