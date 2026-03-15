import React from 'react';
import { Searchbar } from 'react-native-paper';
import { StyleSheet } from 'react-native';

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
      style={styles.bar}
      inputStyle={styles.input}
    />
  );
}

const styles = StyleSheet.create({
  bar: { margin: 16, marginBottom: 8, elevation: 1 },
  input: { fontSize: 14 },
});
