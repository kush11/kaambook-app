import React, { useState } from 'react';
import { TextInput } from 'react-native-paper';
import dayjs from 'dayjs';

interface DatePickerFieldProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  label?: string;
}

export function DatePickerField({ value, onChange, label = 'Date' }: DatePickerFieldProps) {
  const displayValue = value ? dayjs(value).format('DD MMM YYYY') : '';

  return (
    <TextInput
      mode="outlined"
      label={label}
      value={displayValue}
      editable={false}
      right={<TextInput.Icon icon="calendar" onPress={() => {
        // For simplicity, set to today if empty
        if (!value) onChange(dayjs().format('YYYY-MM-DD'));
      }} />}
    />
  );
}
