import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { colors } from '@/src/theme/colors';
import i18n from '@/src/i18n';

interface TodaySummaryCardProps {
  present: number;
  absent: number;
  halfDay: number;
  pending: number;
  total: number;
  markingAll: boolean;
  markingHoliday: boolean;
  onMarkAllPresent: () => void;
  onMarkHoliday: () => void;
}

/**
 * Today's attendance at a glance plus the two bulk actions, shown at the top of
 * the home screen: Present / Absent / Half day / Pending.
 */
export function TodaySummaryCard({
  present,
  absent,
  halfDay,
  pending,
  total,
  markingAll,
  markingHoliday,
  onMarkAllPresent,
  onMarkHoliday,
}: TodaySummaryCardProps) {
  const stats = [
    { label: i18n.t('home.present_today'), value: present },
    { label: i18n.t('home.absent_today'), value: absent },
    { label: i18n.t('attendance.half_day'), value: halfDay },
    { label: i18n.t('home.pending'), value: pending },
  ];

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Text style={styles.title} numberOfLines={1}>{i18n.t('home.today_attendance')}</Text>
        <Text style={styles.marked}>{total - pending}/{total}</Text>
      </View>
      <View style={styles.statsRow}>
        {stats.map((s) => (
          <View key={s.label} style={styles.stat}>
            <Text style={styles.value}>{s.value}</Text>
            <Text style={styles.label} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              {s.label}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.actions}>
        <Button
          mode="contained"
          icon="check-all"
          onPress={onMarkAllPresent}
          loading={markingAll}
          buttonColor="#fff"
          textColor={colors.primaryDark}
          style={styles.primaryBtn}
          labelStyle={styles.btnLabel}
        >
          {i18n.t('home.mark_all_present')}
        </Button>
        <Button
          mode="outlined"
          onPress={onMarkHoliday}
          loading={markingHoliday}
          textColor="#fff"
          style={styles.secondaryBtn}
          labelStyle={styles.btnLabel}
        >
          {i18n.t('home.mark_holiday')}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 4,
    padding: 18,
    borderRadius: 20,
    backgroundColor: colors.primary,
    gap: 14,
  },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
  title: { flex: 1, color: '#fff', fontSize: 14, fontWeight: '500' },
  marked: { color: '#fff', fontSize: 14, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1 },
  value: { color: '#fff', fontSize: 30, fontWeight: '800', lineHeight: 34 },
  label: { color: '#fff', fontSize: 12, fontWeight: '500' },
  actions: { flexDirection: 'row', gap: 8 },
  primaryBtn: { flex: 1, borderRadius: 12 },
  secondaryBtn: { borderRadius: 12, borderColor: '#fff', borderWidth: 1.5 },
  btnLabel: { fontWeight: '700' },
});
