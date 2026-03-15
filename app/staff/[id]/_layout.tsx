import { Stack } from 'expo-router';
import { colors } from '@/src/theme/colors';

export default function StaffLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#fff',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Staff Details' }} />
      <Stack.Screen name="profile" options={{ title: 'Edit Profile' }} />
      <Stack.Screen name="attendance" options={{ title: 'Attendance' }} />
      <Stack.Screen name="payments" options={{ title: 'Payments' }} />
      <Stack.Screen name="add-payment" options={{ title: 'Add Payment', presentation: 'modal' }} />
      <Stack.Screen name="edit-salary" options={{ title: 'Edit Salary', presentation: 'modal' }} />
    </Stack>
  );
}
