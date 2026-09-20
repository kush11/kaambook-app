import { useEffect, useState } from 'react';
import { Stack, usePathname } from 'expo-router';
import * as Sentry from '@sentry/react-native';
import { PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import Head from 'expo-router/head';
import { theme } from '@/src/theme';
import { initDatabase } from '@/src/db/client';
import { seedDatabase } from '@/src/db/seed';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { useBusinessStore } from '@/src/stores/useBusinessStore';
import { colors } from '@/src/theme/colors';
import { AnimatedSplashScreen } from '@/src/components/AnimatedSplashScreen';
import { initAnalytics, track, identifyOwner } from '@/src/utils/analytics';
import { SENTRY_DSN } from '@/src/config/telemetry';

Sentry.init({
  dsn: SENTRY_DSN,
  enabled: !!SENTRY_DSN,
  tracesSampleRate: 0.2,
});

// Keep native splash screen visible while JS loads
SplashScreen.preventAutoHideAsync();

function RootLayout() {
  const [dbReady, setDbReady] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const { isLoading, loadSettings } = useSettingsStore();
  const pathname = usePathname();

  useEffect(() => {
    async function init() {
      // Hide native splash as soon as JS is ready — our animated splash takes over
      await SplashScreen.hideAsync();
      initAnalytics();
      initDatabase();
      await seedDatabase();
      await loadSettings();
      await useBusinessStore.getState().loadBusinesses();
      const s = useSettingsStore.getState();
      // Re-identify returning users so every session links to their phone.
      if (s.ownerPhone) identifyOwner(s.ownerPhone, { language: s.language });
      track('app_open', { language: s.language, onboarded: s.isOnboarded });
      setDbReady(true);
    }
    init();
  }, []);

  // Screen views — one event per route change.
  useEffect(() => {
    if (pathname) track('screen_view', { screen: pathname });
  }, [pathname]);

  const appReady = dbReady && !isLoading;

  if (splashDone) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
        <Head>
          <title>Hisab Pagar - Staff Attendance & Salary Tracker</title>
          <meta name="description" content="Track staff attendance, manage salaries, and run your business efficiently. Free offline app for small businesses in India." />
          <meta name="keywords" content="staff attendance, salary tracker, attendance app, small business, employee management, hisab pagar, payroll" />
          <meta property="og:title" content="Hisab Pagar - Staff Attendance & Salary Tracker" />
          <meta property="og:description" content="Track staff attendance, manage salaries, and run your business efficiently. Free offline app for small businesses." />
          <meta property="og:type" content="website" />
          <meta name="twitter:card" content="summary" />
          <meta name="twitter:title" content="Hisab Pagar - Staff Attendance & Salary Tracker" />
          <meta name="twitter:description" content="Track staff attendance, manage salaries, and run your business efficiently." />
          <meta name="theme-color" content="#16A34A" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="Hisab Pagar" />
        </Head>
        <PaperProvider theme={theme}>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="staff/add" options={{ headerShown: true, title: 'Add Staff', presentation: 'modal' }} />
            <Stack.Screen name="staff/[id]" />
            <Stack.Screen name="settings/language" options={{ headerShown: true, title: 'Language', headerStyle: { backgroundColor: colors.primary }, headerTintColor: '#fff' }} />
            <Stack.Screen name="business/select" options={{ headerShown: true, title: 'Switch Business', headerStyle: { backgroundColor: colors.primary }, headerTintColor: '#fff' }} />
            <Stack.Screen name="business/add" options={{ headerShown: true, title: 'Add Business', presentation: 'modal', headerStyle: { backgroundColor: colors.primary }, headerTintColor: '#fff' }} />
          </Stack>
        </PaperProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <AnimatedSplashScreen isReady={appReady} onFinish={() => setSplashDone(true)}>
      {appReady && (
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaProvider>
          <PaperProvider theme={theme}>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="staff/add" options={{ headerShown: true, title: 'Add Staff', presentation: 'modal' }} />
              <Stack.Screen name="staff/[id]" />
              <Stack.Screen name="business/select" options={{ headerShown: true, title: 'Switch Business', headerStyle: { backgroundColor: colors.primary }, headerTintColor: '#fff' }} />
              <Stack.Screen name="business/add" options={{ headerShown: true, title: 'Add Business', presentation: 'modal', headerStyle: { backgroundColor: colors.primary }, headerTintColor: '#fff' }} />
            </Stack>
          </PaperProvider>
          </SafeAreaProvider>
        </GestureHandlerRootView>
      )}
    </AnimatedSplashScreen>
  );
}

export default Sentry.wrap(RootLayout);
