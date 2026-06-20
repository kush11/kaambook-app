import { Tabs, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TouchableOpacity, Text } from 'react-native';
import { useBusinessStore } from '@/src/stores/useBusinessStore';
import { colors } from '@/src/theme/colors';
import i18n from '@/src/i18n';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#fff',
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: i18n.t('tabs.home'),
          headerTitle: () => {
            const businessName = useBusinessStore.getState().activeBusiness?.name || 'Hisab Pagar';
            return (
              <TouchableOpacity onPress={() => router.push('/business/select')}>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>{businessName}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>{i18n.t('home.switch_business')}</Text>
              </TouchableOpacity>
            );
          },
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-group" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="salary-due"
        options={{
          title: i18n.t('tabs.salary_due'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cash-multiple" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cashbook"
        options={{
          title: i18n.t('tabs.cashbook'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="book-open-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: i18n.t('tabs.settings'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
