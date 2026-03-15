import React, { useCallback, useEffect, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { FAB } from 'react-native-paper';
import { router, useFocusEffect } from 'expo-router';
import { StaffCard } from '@/src/components/staff/StaffCard';
import { SearchBar } from '@/src/components/ui/SearchBar';
import { EmptyState } from '@/src/components/ui/EmptyState';
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
  const { markAttendance } = useAttendanceStore();
  const [search, setSearch] = useState('');
  const [todayRecords, setTodayRecords] = useState<Map<string, AttendanceStatus>>(new Map());

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

  const filtered = staffList.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) && s.status === 'active'
  );

  return (
    <View style={styles.container}>
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
  emptyContainer: { flex: 1 },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: colors.primary,
  },
});
