import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, IconButton } from 'react-native-paper';
import { StaffAvatar } from './StaffAvatar';
import { colors } from '@/src/theme/colors';
import { formatCurrency } from '@/src/utils/formatters';
import type { Staff, AttendanceStatus } from '@/src/types';

interface StaffCardProps {
  staff: Staff;
  todayStatus?: AttendanceStatus;
  onPress: () => void;
  onMarkAttendance: (status: AttendanceStatus) => void;
}

export function StaffCard({ staff, todayStatus, onPress, onMarkAttendance }: StaffCardProps) {
  return (
    <Card style={styles.card} onPress={onPress}>
      <Card.Content style={styles.content}>
        <StaffAvatar name={staff.name} photoUri={staff.photoUri} size={44} />
        <View style={styles.info}>
          <Text variant="titleSmall" numberOfLines={1}>{staff.name}</Text>
          <Text variant="bodySmall" style={styles.salary}>
            {formatCurrency(staff.salaryAmount)}/{staff.salaryType === 'monthly' ? 'mo' : staff.salaryType === 'daily' ? 'day' : 'wk'}
          </Text>
        </View>
        <View style={styles.actions}>
          <IconButton
            icon="check-circle"
            iconColor={todayStatus === 'present' ? colors.present : colors.border}
            size={28}
            onPress={() => onMarkAttendance('present')}
          />
          <IconButton
            icon="close-circle"
            iconColor={todayStatus === 'absent' ? colors.absent : colors.border}
            size={28}
            onPress={() => onMarkAttendance('absent')}
          />
          <IconButton
            icon="circle-half-full"
            iconColor={todayStatus === 'half_day' ? colors.halfDay : colors.border}
            size={28}
            onPress={() => onMarkAttendance('half_day')}
          />
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginVertical: 4, backgroundColor: '#fff' },
  content: { flexDirection: 'row', alignItems: 'center' },
  info: { flex: 1, marginLeft: 12 },
  salary: { color: colors.textSecondary, marginTop: 2 },
  actions: { flexDirection: 'row' },
});
