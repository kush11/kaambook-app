import React, { useCallback, useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Card, Text, Button, List, Divider } from 'react-native-paper';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { StaffAvatar } from '@/src/components/staff/StaffAvatar';
import { SalaryBreakup } from '@/src/components/salary/SalaryBreakup';
import { ConfirmDialog } from '@/src/components/ui/ConfirmDialog';
import { useStaffStore } from '@/src/stores/useStaffStore';
import { colors } from '@/src/theme/colors';
import { formatCurrency } from '@/src/utils/formatters';
import { formatPhone } from '@/src/utils/formatters';
import { calculateSalary } from '@/src/utils/salary';
import { generateAndShareReport, generateReport, shareReportWhatsApp } from '@/src/utils/report';
import { useBusinessStore } from '@/src/stores/useBusinessStore';
import { db } from '@/src/db/client';
import { attendance, payments } from '@/src/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import dayjs from 'dayjs';
import type { SalaryBreakdown as SalaryBreakdownType, Attendance, Payment } from '@/src/types';
import i18n from '@/src/i18n';

export default function StaffDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getStaffById, deleteStaff, loadStaff } = useStaffStore();
  const [breakdown, setBreakdown] = useState<SalaryBreakdownType | null>(null);
  const [showDelete, setShowDelete] = useState(false);

  const { activeBusiness } = useBusinessStore();
  const staffMember = getStaffById(id);

  const loadData = useCallback(async () => {
    if (!staffMember) return;
    try {
      const now = dayjs();
      const year = now.year();
      const month = now.month();
      const startDate = now.startOf('month').format('YYYY-MM-DD');
      const endDate = now.endOf('month').format('YYYY-MM-DD');

      const att = await db.select().from(attendance)
        .where(and(eq(attendance.staffId, id), gte(attendance.date, startDate), lte(attendance.date, endDate))) as Attendance[];
      const pay = await db.select().from(payments)
        .where(and(eq(payments.staffId, id), gte(payments.date, startDate), lte(payments.date, endDate))) as Payment[];

      const result = calculateSalary(staffMember, att, pay, year, month);
      setBreakdown(result);
    } catch (e) {
      console.error('Failed to load staff data:', e);
    }
  }, [id, staffMember]);

  const handleShareReport = async () => {
    if (!staffMember || !breakdown || !activeBusiness) return;
    const now = dayjs();
    const year = now.year();
    const month = now.month();
    const startDate = now.startOf('month').format('YYYY-MM-DD');
    const endDate = now.endOf('month').format('YYYY-MM-DD');
    const pay = await db.select().from(payments)
      .where(and(eq(payments.staffId, id), gte(payments.date, startDate), lte(payments.date, endDate)));
    await generateAndShareReport(activeBusiness.name, staffMember, breakdown, pay as Payment[], year, month);
  };

  const handleWhatsAppShare = async () => {
    if (!staffMember || !breakdown || !activeBusiness) return;
    const now = dayjs();
    const yr = now.year();
    const mo = now.month();
    const startDate = now.startOf('month').format('YYYY-MM-DD');
    const endDate = now.endOf('month').format('YYYY-MM-DD');
    const pay = await db.select().from(payments)
      .where(and(eq(payments.staffId, id), gte(payments.date, startDate), lte(payments.date, endDate)));
    const uri = await generateReport(activeBusiness.name, staffMember, breakdown, pay as Payment[], yr, mo);
    await shareReportWhatsApp(uri, staffMember, yr, mo);
  };

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  if (!staffMember) return null;

  const handleDelete = async () => {
    await deleteStaff(id);
    router.back();
  };

  const salaryLabel = staffMember.salaryType === 'monthly' ? i18n.t('salary.per_month')
    : staffMember.salaryType === 'daily' ? i18n.t('salary.per_day')
    : i18n.t('salary.per_week');

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <Card style={styles.headerCard}>
        <Card.Content style={styles.headerContent}>
          <StaffAvatar name={staffMember.name} photoUri={staffMember.photoUri} size={64} />
          <View style={styles.headerInfo}>
            <Text variant="titleLarge">{staffMember.name}</Text>
            {staffMember.phone && (
              <Text variant="bodyMedium" style={styles.phone}>{formatPhone(staffMember.phone)}</Text>
            )}
            <Text variant="titleSmall" style={styles.salary}>
              {formatCurrency(staffMember.salaryAmount)}{salaryLabel}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Quick Actions */}
      <View style={styles.actions}>
        <Button mode="contained" icon="calendar" onPress={() => router.push(`/staff/${id}/attendance`)} style={styles.actionBtn} compact>
          {i18n.t('attendance.title')}
        </Button>
        <Button mode="contained" icon="cash" onPress={() => router.push(`/staff/${id}/add-payment`)} style={styles.actionBtn} compact>
          {i18n.t('payment.add')}
        </Button>
      </View>
      <View style={styles.actions}>
        <Button mode="outlined" icon="file-pdf-box" onPress={handleShareReport} style={styles.actionBtn} compact>
          {i18n.t('staff.pdf_report')}
        </Button>
        <Button mode="outlined" icon="whatsapp" onPress={handleWhatsAppShare} style={styles.actionBtn} compact buttonColor="#25D366" textColor="#fff">
          WhatsApp
        </Button>
      </View>

      {/* Salary Breakdown */}
      {breakdown && <SalaryBreakup breakdown={breakdown} />}

      {/* Navigation Links */}
      <Card style={styles.linksCard}>
        <List.Item
          title={i18n.t('payment.title')}
          left={props => <List.Icon {...props} icon="cash-multiple" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => router.push(`/staff/${id}/payments`)}
        />
        <Divider />
        <List.Item
          title={i18n.t('staff.edit')}
          left={props => <List.Icon {...props} icon="account-edit" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => router.push(`/staff/${id}/profile`)}
        />
        <Divider />
        <List.Item
          title={i18n.t('salary.edit_salary')}
          left={props => <List.Icon {...props} icon="currency-inr" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => router.push(`/staff/${id}/edit-salary`)}
        />
      </Card>

      {/* Delete */}
      <Button
        mode="text"
        textColor={colors.error}
        onPress={() => setShowDelete(true)}
        style={styles.deleteBtn}
      >
        {i18n.t('staff.delete')}
      </Button>

      <ConfirmDialog
        visible={showDelete}
        title={i18n.t('staff.delete')}
        message={i18n.t('staff.delete_confirm')}
        confirmLabel={i18n.t('common.delete')}
        onConfirm={handleDelete}
        onDismiss={() => setShowDelete(false)}
        destructive
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerCard: { margin: 16, backgroundColor: '#fff' },
  headerContent: { flexDirection: 'row', alignItems: 'center' },
  headerInfo: { marginLeft: 16, flex: 1 },
  phone: { color: colors.textSecondary, marginTop: 2 },
  salary: { color: colors.primary, marginTop: 4 },
  actions: { flexDirection: 'row', paddingHorizontal: 16, gap: 12 },
  actionBtn: { flex: 1 },
  reportBtn: { flex: 1, marginTop: 8 },
  linksCard: { margin: 16, backgroundColor: '#fff' },
  deleteBtn: { margin: 16 },
});
