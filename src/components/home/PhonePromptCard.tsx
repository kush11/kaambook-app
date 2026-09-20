import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, TextInput, Button } from 'react-native-paper';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { colors } from '@/src/theme/colors';
import i18n from '@/src/i18n';

/**
 * One-time card asking existing users for their mobile number so we can
 * call them for feedback. Renders nothing once a number is saved or the
 * prompt is dismissed. New users are asked during onboarding instead.
 */
export function PhonePromptCard() {
  const { isOnboarded, ownerPhone, phonePromptDismissed, setOwnerPhone, dismissPhonePrompt } =
    useSettingsStore();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState(false);

  if (!isOnboarded || ownerPhone || phonePromptDismissed) return null;

  const handleSave = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      setError(true);
      return;
    }
    await setOwnerPhone(digits, 'home_prompt');
  };

  return (
    <Card style={styles.card} mode="outlined">
      <Card.Content>
        <Text variant="titleMedium" style={styles.title}>
          {i18n.t('phone_prompt.title')}
        </Text>
        <Text variant="bodySmall" style={styles.subtitle}>
          {i18n.t('phone_prompt.subtitle')}
        </Text>
        <TextInput
          mode="outlined"
          dense
          placeholder={i18n.t('phone_prompt.placeholder')}
          value={phone}
          onChangeText={(t) => {
            setPhone(t);
            setError(false);
          }}
          keyboardType="phone-pad"
          maxLength={13}
          error={error}
          left={<TextInput.Icon icon="phone" />}
          style={styles.input}
        />
        <View style={styles.actions}>
          <Button mode="text" onPress={dismissPhonePrompt} textColor={colors.textSecondary}>
            {i18n.t('phone_prompt.later')}
          </Button>
          <Button mode="contained" onPress={handleSave}>
            {i18n.t('phone_prompt.save')}
          </Button>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 12, marginTop: 10, backgroundColor: colors.surface },
  title: { color: colors.text, fontWeight: 'bold' },
  subtitle: { color: colors.textSecondary, marginTop: 2, marginBottom: 10 },
  input: { backgroundColor: colors.surface },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 10 },
});
