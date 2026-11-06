export const lightColors = {
  primary: '#C2410C',        // Brand orange, deep enough for white text on top
  primaryLight: '#FB923C',
  primaryDark: '#9A3412',
  primaryTint: '#FFEDD5',    // Soft orange behind active tabs and tonal buttons
  secondary: '#92400E',      // Earthy brown
  secondaryLight: '#B45309',
  background: '#FAF7F0',     // Warm off-white
  surface: '#FFFFFF',
  surfaceVariant: '#F3EEE4',
  text: '#1F1A17',
  textSecondary: '#6B635B',
  error: '#DC2626',
  success: '#15803D',
  warning: '#F59E0B',
  border: '#E8E2D6',
  divider: '#F0EBE0',
  present: '#15803D',
  absent: '#B91C1C',
  halfDay: '#B45309',
  paidLeave: '#3B82F6',
  holiday: '#8B5CF6',
  weekOff: '#6B7280',
};

export type Palette = { [K in keyof typeof lightColors]: string };

/**
 * Warm dark palette. Brand, present and absent colours are a step brighter than in light
 * mode so text in those colours stays readable on the dark background, while white text
 * on top of them (buttons, the attendance summary) keeps enough contrast.
 */
export const darkColors: Palette = {
  primary: '#EA580C',
  primaryLight: '#FB923C',
  primaryDark: '#FDBA74',    // used for active tab text: needs to be light on dark
  primaryTint: '#3D2617',
  secondary: '#D97706',
  secondaryLight: '#F59E0B',
  background: '#171311',
  surface: '#221D1A',
  surfaceVariant: '#2D2622',
  text: '#F4EEE8',
  textSecondary: '#B5AA9F',
  error: '#F87171',
  success: '#22C55E',
  warning: '#FBBF24',
  border: '#3A322C',
  divider: '#2D2622',
  present: '#16A34A',
  absent: '#DC2626',
  halfDay: '#D97706',
  paidLeave: '#60A5FA',
  holiday: '#A78BFA',
  weekOff: '#9CA3AF',
};

/**
 * Light palette as a constant, for places that must not follow the phone's theme
 * (PDF salary slips, the native splash). Screens use useColors() / makeStyles().
 */
export const colors = lightColors;
