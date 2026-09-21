import { MD3LightTheme } from 'react-native-paper';
import { colors } from './colors';

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    primaryContainer: colors.primaryTint,
    onPrimaryContainer: colors.primaryDark,
    secondary: colors.secondary,
    secondaryContainer: colors.secondaryLight,
    background: colors.background,
    surface: colors.surface,
    surfaceVariant: colors.surfaceVariant,
    error: colors.error,
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onBackground: colors.text,
    onSurface: colors.text,
    outline: colors.border,
    outlineVariant: colors.border,
    onSurfaceVariant: colors.textSecondary,
    // Paper tints search bars, dialogs and menus with these. The defaults are
    // lavender, which clashes with the warm orange palette.
    elevation: {
      level0: 'transparent',
      level1: '#F8F7F2',
      level2: '#F4F3EC',
      level3: '#F0F0EA',
      level4: '#EEEDE6',
      level5: '#EBEAE2',
    },
  },
};

// Shared by every navigator so headers sit on the page background instead of a
// solid brand bar.
export const headerOptions = {
  headerStyle: { backgroundColor: colors.background },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: '700' as const },
  headerShadowVisible: false,
};

export type AppTheme = typeof theme;
export { colors };
