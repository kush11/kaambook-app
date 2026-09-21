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
      <View style={styles.pill}>
        <IconButton icon="chevron-left" iconColor={colors.primary} onPress={onPrev} style={styles.arrow} />
        <Text variant="titleMedium" style={styles.title}>
          {getMonthYear(year, month)}
        </Text>
        <IconButton icon="chevron-right" iconColor={colors.primary} onPress={onNext} style={styles.arrow} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingTop: 4, paddingBottom: 10 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  arrow: { margin: 0, width: 44, height: 44 },
  title: { minWidth: 140, textAlign: 'center', color: colors.text, fontWeight: '600' },
});
