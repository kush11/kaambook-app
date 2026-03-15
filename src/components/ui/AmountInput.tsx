import React, { useState } from 'react';
import { TextInput } from 'react-native-paper';

interface AmountInputProps {
  value: number;
  onChangeValue: (amount: number) => void;
  label?: string;
  error?: boolean;
}

export function AmountInput({ value, onChangeValue, label = '₹ Amount', error }: AmountInputProps) {
  const [text, setText] = useState(value > 0 ? String(value) : '');

  const handleChange = (t: string) => {
    const cleaned = t.replace(/[^0-9]/g, '');
    setText(cleaned);
    onChangeValue(Number(cleaned) || 0);
  };

  return (
    <TextInput
      mode="outlined"
      label={label}
      value={text}
      onChangeText={handleChange}
      keyboardType="numeric"
      left={<TextInput.Affix text="₹" />}
      error={error}
    />
  );
}
