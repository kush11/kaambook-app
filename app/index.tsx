import { Redirect } from 'expo-router';
import { useSettingsStore } from '@/src/stores/useSettingsStore';

export default function Index() {
  const isLoading = useSettingsStore((s) => s.isLoading);
  const isOnboarded = useSettingsStore((s) => s.isOnboarded);

  // Wait until settings are loaded from the database before routing. Otherwise
  // the default isOnboarded=false would flash the onboarding screen for users
  // who have already completed it.
  if (isLoading) return null;

  return <Redirect href={isOnboarded ? '/(tabs)/home' : '/onboarding'} />;
}
