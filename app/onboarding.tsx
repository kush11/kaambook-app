import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Button, TextInput } from 'react-native-paper';
import { router } from 'expo-router';
import { LanguagePicker } from '@/src/components/settings/LanguagePicker';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { useBusinessStore } from '@/src/stores/useBusinessStore';
import { colors } from '@/src/theme/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import i18n from '@/src/i18n';

export default function OnboardingScreen() {
  const { language, setLanguage, completeOnboarding } = useSettingsStore();
  const { activeBusiness, updateBusiness, addBusiness } = useBusinessStore();
  const [selectedLang, setSelectedLang] = useState(language);
  const [businessName, setBusinessName] = useState('');

  const handleLanguageChange = async (lang: string) => {
    setSelectedLang(lang);
    await setLanguage(lang);
  };

  const handleGetStarted = async () => {
    const trimmed = businessName.trim();
    if (trimmed) {
      // A default business is seeded on first launch — rename it instead of
      // creating a duplicate. Fall back to creating one if none exists.
      if (activeBusiness) {
        await updateBusiness(activeBusiness.id, trimmed);
      } else {
        await addBusiness(trimmed);
      }
    }
    await completeOnboarding();
    router.replace('/(tabs)/home');
  };

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <MaterialCommunityIcons name="book-open-page-variant" size={72} color={colors.primary} />
        <Text variant="headlineLarge" style={styles.title}>
          {i18n.t('onboarding.title')}
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          {i18n.t('onboarding.subtitle')}
        </Text>
      </View>

      <View style={styles.middle}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text variant="titleMedium" style={styles.fieldLabel}>
            {i18n.t('business.name')}
          </Text>
          <TextInput
            mode="outlined"
            placeholder={i18n.t('business.name_placeholder')}
            value={businessName}
            onChangeText={setBusinessName}
            style={styles.input}
            left={<TextInput.Icon icon="domain" />}
          />

          <Text variant="titleMedium" style={styles.langLabel}>
            {i18n.t('onboarding.select_language')}
          </Text>
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
  top: { alignItems: 'center', marginTop: 48 },
  title: { marginTop: 20, fontWeight: 'bold', color: colors.text, textAlign: 'center' },
  subtitle: { marginTop: 10, color: colors.textSecondary, textAlign: 'center' },
  middle: { flex: 1, marginTop: 24 },
  fieldLabel: { marginBottom: 8, color: colors.text },
  input: { marginBottom: 20, backgroundColor: colors.surface },
  langLabel: { marginBottom: 8, color: colors.text },
  button: { marginBottom: 32 },
  buttonContent: { paddingVertical: 8 },
  buttonLabel: { fontSize: 16 },
});
