import React, { useCallback, useEffect, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, TouchableRipple } from 'react-native-paper';
import { router, useFocusEffect } from 'expo-router';
import { StaffCard } from '@/src/components/staff/StaffCard';
import { SearchBar } from '@/src/components/ui/SearchBar';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { TodaySummaryCard } from '@/src/components/home/TodaySummaryCard';
import { PhonePromptCard } from '@/src/components/home/PhonePromptCard';
import { BackupReminderCard } from '@/src/components/home/BackupReminderCard';
import { useStaffStore } from '@/src/stores/useStaffStore';
import { useAttendanceStore } from '@/src/stores/useAttendanceStore';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { db } from '@/src/db/client';
import { attendance } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { colors } from '@/src/theme/colors';
import { today } from '@/src/utils/date';
import type { AttendanceStatus, Attendance } from '@/src/types';
import i18n from '@/src/i18n';

export default function HomeScreen() {
  const { staffList, loadStaff } = useStaffStore();
  const { activeBusinessId } = useSettingsStore();
  const { markAttendance, markAllPresent, markAllStatus } = useAttendanceStore();
  const [search, setSearch] = useState('');
  const [todayRecords, setTodayRecords] = useState<Map<string, AttendanceStatus>>(new Map());
  const [markingAll, setMarkingAll] = useState(false);
  const [markingHoliday, setMarkingHoliday] = useState(false);

  const loadData = useCallback(async () => {
    if (activeBusinessId) {
      await loadStaff(activeBusinessId);
      await loadTodayAttendance();
    }
  }, [activeBusinessId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const loadTodayAttendance = async () => {
    try {
      const todayDate = today();
      const rows = await db.select().from(attendance).where(eq(attendance.date, todayDate));
      const map = new Map<string, AttendanceStatus>();
      rows.forEach((r) => map.set(r.staffId, r.status as AttendanceStatus));
      setTodayRecords(map);
    } catch (e) {
      console.error('Failed to load today attendance:', e);
    }
  };

  const handleMarkAttendance = async (staffId: string, status: AttendanceStatus) => {
    await markAttendance(staffId, today(), status);
    await loadTodayAttendance();
  };

  // Today's summary across all active staff (independent of the search filter).
  const activeStaff = staffList.filter(s => s.status === 'active');
  let presentCount = 0;
  let absentCount = 0;
  let halfDayCount = 0;
  let markedCount = 0;
  activeStaff.forEach((s) => {
    const st = todayRecords.get(s.id);
    if (st) {
      markedCount++;
      if (st === 'present') presentCount++;
      else if (st === 'absent') absentCount++;
      else if (st === 'half_day') halfDayCount++;
    }
  });
  const pendingCount = activeStaff.length - markedCount;

  const handleMarkAllPresent = async () => {
    setMarkingAll(true);
    await markAllPresent(activeStaff.map((s) => s.id), today());
    await loadTodayAttendance();
    setMarkingAll(false);
  };

  const handleMarkHoliday = async () => {
    setMarkingHoliday(true);
    await markAllStatus(activeStaff.map((s) => s.id), today(), 'holiday');
    await loadTodayAttendance();
    setMarkingHoliday(false);
  };

  const filtered = staffList.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) && s.status === 'active'
  );

  return (
    <View style={styles.container}>
      <PhonePromptCard />
      <BackupReminderCard />
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          activeStaff.length > 0 ? (
            <View>
              <TodaySummaryCard
                present={presentCount}
                absent={absentCount}
                halfDay={halfDayCount}
                pending={pendingCount}
                total={activeStaff.length}
                markingAll={markingAll}
                markingHoliday={markingHoliday}
                onMarkAllPresent={handleMarkAllPresent}
                onMarkHoliday={handleMarkHoliday}
              />
              <SearchBar
                value={search}
                onChangeText={setSearch}
                placeholder={i18n.t('home.search_placeholder')}
              />
            </View>
          ) : null
        }
        renderItem={({ item, index }) => (
          <StaffCard
            staff={item}
            isFirst={index === 0}
            isLast={index === filtered.length - 1}
            todayStatus={todayRecords.get(item.id)}
            onPress={() => router.push(`/staff/${item.id}`)}
            onMarkAttendance={(status) => handleMarkAttendance(item.id, status)}
          />
        )}
        contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="account-plus"
            title={i18n.t('home.no_staff')}
            subtitle={i18n.t('home.add_first_staff')}
          />
        }
      />
      {/* Paper's extended FAB clips its label on some OEM fonts, so this is a plain pill. */}
      <TouchableRipple
        borderless
        onPress={() => router.push('/staff/add')}
        accessibilityRole="button"
        style={styles.fab}
      >
        <View style={styles.fabContent}>
          <MaterialCommunityIcons name="plus" size={22} color="#fff" />
          <Text style={styles.fabLabel}>{i18n.t('staff.add')}</Text>
        </View>
      </TouchableRipple>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { paddingBottom: 96 },
  emptyContainer: { flex: 1 },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    borderRadius: 26,
    backgroundColor: colors.primary,
    elevation: 4,
  },
  fabContent: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 52, paddingLeft: 16, paddingRight: 22 },
  fabLabel: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
