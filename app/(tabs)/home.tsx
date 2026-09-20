import React, { useCallback, useEffect, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { FAB, Button } from 'react-native-paper';
import { router, useFocusEffect } from 'expo-router';
import { StaffCard } from '@/src/components/staff/StaffCard';
import { SearchBar } from '@/src/components/ui/SearchBar';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { DashboardStats } from '@/src/components/home/DashboardStats';
import { PhonePromptCard } from '@/src/components/home/PhonePromptCard';
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
  let markedCount = 0;
  activeStaff.forEach((s) => {
    const st = todayRecords.get(s.id);
    if (st) {
      markedCount++;
      if (st === 'present') presentCount++;
      else if (st === 'absent') absentCount++;
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
      {staffList.length > 0 && (
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder={i18n.t('home.search_placeholder')}
        />
      )}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        ListHeaderComponent={
          activeStaff.length > 0 ? (
            <View>
              <DashboardStats
                present={presentCount}
                absent={absentCount}
                pending={pendingCount}
                total={activeStaff.length}
              />
              <View style={styles.headerActions}>
                <Button
                  mode="contained"
                  icon="check-all"
                  onPress={handleMarkAllPresent}
                  loading={markingAll}
                  buttonColor={colors.present}
                  textColor="#fff"
                  style={styles.headerBtn}
                >
                  {i18n.t('home.mark_all_present')}
                </Button>
                <Button
                  mode="outlined"
                  icon="calendar-star"
                  onPress={handleMarkHoliday}
                  loading={markingHoliday}
                  style={styles.headerBtn}
                >
                  {i18n.t('home.mark_holiday')}
                </Button>
              </View>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <StaffCard
            staff={item}
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
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/staff/add')}
        color="#fff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { paddingBottom: 80 },
  headerActions: { flexDirection: 'row', gap: 8, marginHorizontal: 12, marginTop: 10, marginBottom: 4 },
  headerBtn: { flex: 1 },
  emptyContainer: { flex: 1 },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: colors.primary,
  },
});
