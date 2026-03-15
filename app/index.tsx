import { Redirect } from 'expo-router';
import { useSettingsStore } from '@/src/stores/useSettingsStore';

export default function Index() {
  const { isOnboarded } = useSettingsStore();

  if (!isOnboarded) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)/home" />;
}
