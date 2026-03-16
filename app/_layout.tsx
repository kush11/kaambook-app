import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
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
// import { vexo } from 'vexo-analytics';

// vexo('deae8c03-9856-4060-9c88-12cdf703631f');

// Keep native splash screen visible while JS loads
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const { isLoading, loadSettings } = useSettingsStore();

  useEffect(() => {
    async function init() {
      // Hide native splash as soon as JS is ready — our animated splash takes over
      await SplashScreen.hideAsync();
      initDatabase();
      await seedDatabase();
      await loadSettings();
      await useBusinessStore.getState().loadBusinesses();
      setDbReady(true);
    }
    init();
  }, []);

  const appReady = dbReady && !isLoading;

  if (splashDone) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Head>
          <title>KaamBook - Staff Attendance & Salary Tracker</title>
          <meta name="description" content="Track staff attendance, manage salaries, and run your business efficiently. Free offline app for small businesses in India." />
          <meta name="keywords" content="staff attendance, salary tracker, attendance app, small business, employee management, kaambook, payroll" />
          <meta property="og:title" content="KaamBook - Staff Attendance & Salary Tracker" />
          <meta property="og:description" content="Track staff attendance, manage salaries, and run your business efficiently. Free offline app for small businesses." />
          <meta property="og:type" content="website" />
          <meta name="twitter:card" content="summary" />
          <meta name="twitter:title" content="KaamBook - Staff Attendance & Salary Tracker" />
          <meta name="twitter:description" content="Track staff attendance, manage salaries, and run your business efficiently." />
          <meta name="theme-color" content="#16A34A" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="KaamBook" />
        </Head>
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
      </GestureHandlerRootView>
    );
  }

  return (
    <AnimatedSplashScreen isReady={appReady} onFinish={() => setSplashDone(true)}>
      {appReady && (
        <GestureHandlerRootView style={{ flex: 1 }}>
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
        </GestureHandlerRootView>
      )}
    </AnimatedSplashScreen>
  );
}
