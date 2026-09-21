import { Stack } from 'expo-router';
import { headerOptions } from '@/src/theme';
import i18n from '@/src/i18n';

export default function StaffLayout() {
  return (
    <Stack screenOptions={headerOptions}>
      <Stack.Screen name="index" options={{ title: i18n.t('staff.details') }} />
      <Stack.Screen name="profile" options={{ title: i18n.t('staff.edit') }} />
      <Stack.Screen name="attendance" options={{ title: i18n.t('attendance.title') }} />
      <Stack.Screen name="payments" options={{ title: i18n.t('payment.title') }} />
      <Stack.Screen name="add-payment" options={{ title: i18n.t('payment.add'), presentation: 'modal' }} />
      <Stack.Screen name="edit-salary" options={{ title: i18n.t('salary.edit_salary'), presentation: 'modal' }} />
    </Stack>
  );
}
