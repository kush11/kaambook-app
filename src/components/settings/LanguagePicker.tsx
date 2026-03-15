import React from 'react';
import { View, StyleSheet } from 'react-native';
import { RadioButton, Text } from 'react-native-paper';
import { colors } from '@/src/theme/colors';

interface LanguagePickerProps {
  value: string;
  onChange: (lang: string) => void;
}

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी (Hindi)' },
  { code: 'gu', label: 'ગુજરાતી (Gujarati)' },
  { code: 'mr', label: 'मराठी (Marathi)' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ (Punjabi)' },
  { code: 'bn', label: 'বাংলা (Bengali)' },
  { code: 'ta', label: 'தமிழ் (Tamil)' },
  { code: 'te', label: 'తెలుగు (Telugu)' },
  { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
  { code: 'od', label: 'ଓଡ଼ିଆ (Odia)' },
];

export function LanguagePicker({ value, onChange }: LanguagePickerProps) {
  return (
    <RadioButton.Group onValueChange={onChange} value={value}>
      {LANGUAGES.map(lang => (
        <RadioButton.Item
          key={lang.code}
          label={lang.label}
          value={lang.code}
          style={styles.item}
        />
      ))}
    </RadioButton.Group>
  );
}

const styles = StyleSheet.create({
  item: { paddingHorizontal: 8 },
});
