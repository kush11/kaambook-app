import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { colors } from '@/src/theme/colors';
import i18n from '@/src/i18n';

interface DashboardStatsProps {
  present: number;
  absent: number;
  pending: number;
  total: number;
}

/**
 * A compact at-a-glance summary of today's attendance shown at the top of the
 * home screen: Present / Absent / Pending / Total.
 */
export function DashboardStats({ present, absent, pending, total }: DashboardStatsProps) {
  const tiles = [
    { label: i18n.t('home.present_today'), value: present, color: colors.present },
    { label: i18n.t('home.absent_today'), value: absent, color: colors.absent },
    { label: i18n.t('home.pending'), value: pending, color: colors.warning },
    { label: i18n.t('home.total_staff'), value: total, color: colors.textSecondary },
  ];

  return (
    <View style={styles.row}>
      {tiles.map((t) => (
        <View key={t.label} style={styles.tile}>
          <Text style={[styles.value, { color: t.color }]}>{t.value}</Text>
          <Text style={styles.label} numberOfLines={1}>{t.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 12,
    gap: 8,
  },
  tile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
  },
  label: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
