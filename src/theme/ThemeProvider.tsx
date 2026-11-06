/**
 * Light / dark theme for the whole app.
 *
 * The owner picks System, Light or Dark in Settings (stored as `theme_mode`); System
 * follows the phone. Screens read colours with useColors() and build styles with
 * makeStyles(), which creates each StyleSheet once per theme.
 */
import React, { createContext, useContext, useMemo } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider as NavigationThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useSettingsStore } from '../stores/useSettingsStore';
import { lightColors, type Palette } from './colors';
import { paletteFor, paperThemes, headerOptionsFor, type Scheme } from './themes';

interface ThemeValue {
  scheme: Scheme;
  colors: Palette;
}

const ThemeContext = createContext<ThemeValue>({ scheme: 'light', colors: lightColors });

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useSettingsStore((s) => s.themeMode);
  const system = useColorScheme();
  const scheme: Scheme = mode === 'system' ? (system === 'dark' ? 'dark' : 'light') : mode;

  const value = useMemo(() => ({ scheme, colors: paletteFor(scheme) }), [scheme]);
  const navTheme = useMemo(() => {
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
    const c = value.colors;
    return {
      ...base,
      colors: { ...base.colors, primary: c.primary, background: c.background, card: c.surface, text: c.text, border: c.border },
    };
  }, [scheme, value.colors]);

  return (
    <ThemeContext.Provider value={value}>
      <NavigationThemeProvider value={navTheme}>
        <PaperProvider theme={paperThemes[scheme]}>
          <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
          {children}
        </PaperProvider>
      </NavigationThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useColors(): Palette {
  return useContext(ThemeContext).colors;
}

export function useScheme(): Scheme {
  return useContext(ThemeContext).scheme;
}

export function useHeaderOptions() {
  const c = useColors();
  return useMemo(() => headerOptionsFor(c), [c]);
}

/**
 * Theme-aware replacement for a module-level StyleSheet.create:
 *
 *   const useStyles = makeStyles((colors) => ({ card: { backgroundColor: colors.surface } }));
 *   function Screen() { const styles = useStyles(); ... }
 */
export function makeStyles<T extends StyleSheet.NamedStyles<T>>(factory: (colors: Palette) => T): () => T {
  const cache: Partial<Record<Scheme, T>> = {};
  return function useStyles(): T {
    const { scheme, colors } = useContext(ThemeContext);
    return (cache[scheme] ??= StyleSheet.create(factory(colors)));
  };
}
