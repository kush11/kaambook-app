import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { lightColors, darkColors, type Palette } from './colors';

export type Scheme = 'light' | 'dark';

export function paletteFor(scheme: Scheme): Palette {
  return scheme === 'dark' ? darkColors : lightColors;
}

function buildPaperTheme(scheme: Scheme) {
  const base = scheme === 'dark' ? MD3DarkTheme : MD3LightTheme;
  const c = paletteFor(scheme);
  return {
    ...base,
    dark: scheme === 'dark',
    colors: {
      ...base.colors,
      primary: c.primary,
      primaryContainer: c.primaryTint,
      onPrimaryContainer: c.primaryDark,
      secondary: c.secondary,
      secondaryContainer: c.secondaryLight,
      background: c.background,
      surface: c.surface,
      surfaceVariant: c.surfaceVariant,
      surfaceDisabled: scheme === 'dark' ? 'rgba(244, 238, 232, 0.12)' : base.colors.surfaceDisabled,
      error: c.error,
      onPrimary: '#FFFFFF',
      onSecondary: '#FFFFFF',
      onBackground: c.text,
      onSurface: c.text,
      outline: c.border,
      outlineVariant: c.border,
      onSurfaceVariant: c.textSecondary,
      inverseSurface: c.text,
      inverseOnSurface: c.background,
      // Paper tints search bars, dialogs and menus with these. The defaults are
      // lavender, which clashes with the warm orange palette.
      elevation: scheme === 'dark'
        ? { level0: 'transparent', level1: '#241F1B', level2: '#28221E', level3: '#2C2621', level4: '#2E2823', level5: '#312A25' }
        : { level0: 'transparent', level1: '#F8F7F2', level2: '#F4F3EC', level3: '#F0F0EA', level4: '#EEEDE6', level5: '#EBEAE2' },
    },
  };
}

export const paperThemes = { light: buildPaperTheme('light'), dark: buildPaperTheme('dark') };

/** Light theme, kept for code that does not follow the phone's theme. */
export const theme = paperThemes.light;
export type AppTheme = typeof theme;

// Shared by every navigator so headers sit on the page background instead of a
// solid brand bar.
export function headerOptionsFor(c: Palette) {
  return {
    headerStyle: { backgroundColor: c.background },
    headerTintColor: c.text,
    headerTitleStyle: { fontWeight: '700' as const },
    headerShadowVisible: false,
    contentStyle: { backgroundColor: c.background },
  };
}
