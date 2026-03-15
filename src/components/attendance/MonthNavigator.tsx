import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { getMonthYear } from '@/src/utils/date';
import { colors } from '@/src/theme/colors';

interface MonthNavigatorProps {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
}

export function MonthNavigator({ year, month, onPrev, onNext }: MonthNavigatorProps) {
  return (
    <View style={styles.container}>
      <IconButton icon="chevron-left" onPress={onPrev} />
      <Text variant="titleMedium" style={styles.title}>
        {getMonthYear(year, month)}
      </Text>
      <IconButton icon="chevron-right" onPress={onNext} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
  title: { minWidth: 150, textAlign: 'center', color: colors.text },
});
