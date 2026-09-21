import React from 'react';
import { Searchbar } from 'react-native-paper';
import { StyleSheet } from 'react-native';
import { colors } from '@/src/theme/colors';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChangeText, placeholder = 'Search...' }: SearchBarProps) {
  return (
    <Searchbar
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      elevation={0}
      iconColor={colors.textSecondary}
      style={styles.bar}
      inputStyle={styles.input}
    />
  );
}

const styles = StyleSheet.create({
  bar: {
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  // Paper gives the input a 56dp minimum, which overflows the 48dp pill.
  input: { fontSize: 15, minHeight: 0 },
});
