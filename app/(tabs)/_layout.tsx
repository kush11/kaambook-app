import React from 'react';
import { Tabs, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBusinessStore } from '@/src/stores/useBusinessStore';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { colors } from '@/src/theme/colors';
import { headerOptions } from '@/src/theme';
import i18n from '@/src/i18n';
import { shareApp } from '@/src/utils/shareApp';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

// Active tab gets a soft orange pill behind its icon.
function TabIcon({ name, color, focused }: { name: IconName; color: string; focused: boolean }) {
  return (
    <View style={[styles.iconPill, focused && styles.iconPillActive]}>
      <MaterialCommunityIcons name={name} size={22} color={focused ? colors.primary : color} />
    </View>
  );
}

function HomeHeaderTitle() {
  const businessName = useBusinessStore((s) => s.activeBusiness?.name) || 'Hisab Pagar';
  return (
    <TouchableOpacity onPress={() => router.push('/business/select')}>
      <View style={styles.businessRow}>
        <Text style={styles.businessName} numberOfLines={1}>{businessName}</Text>
        <MaterialCommunityIcons name="chevron-down" size={22} color={colors.primary} />
      </View>
      <Text style={styles.businessHint}>{i18n.t('home.switch_business')}</Text>
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  // Re-render when the language changes, otherwise tab labels and headers keep the old language.
  useSettingsStore((s) => s.language);
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        ...headerOptions,
        tabBarActiveTintColor: colors.primaryDark,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 64 + insets.bottom,
          paddingTop: 6,
        },
        tabBarIconStyle: { width: 56, height: 30 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: i18n.t('tabs.home'),
          headerTitleAlign: 'left',
          headerTitle: () => <HomeHeaderTitle />,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => shareApp('home_header')}
              accessibilityLabel={i18n.t('settings.share_app')}
              style={styles.shareBtn}
            >
              <MaterialCommunityIcons name="share-variant-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          ),
          tabBarIcon: (props) => <TabIcon name="account-group-outline" {...props} />,
        }}
      />
      <Tabs.Screen
        name="salary-due"
        options={{
          title: i18n.t('tabs.salary_due'),
          tabBarIcon: (props) => <TabIcon name="currency-inr" {...props} />,
        }}
      />
      <Tabs.Screen
        name="cashbook"
        options={{
          title: i18n.t('tabs.cashbook'),
          tabBarIcon: (props) => <TabIcon name="book-open-outline" {...props} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: i18n.t('tabs.settings'),
          tabBarIcon: (props) => <TabIcon name="cog-outline" {...props} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconPill: { width: 56, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  iconPillActive: { backgroundColor: colors.primaryTint },
  businessRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  businessName: { color: colors.text, fontSize: 20, fontWeight: '700', flexShrink: 1 },
  businessHint: { color: colors.textSecondary, fontSize: 12 },
  shareBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
