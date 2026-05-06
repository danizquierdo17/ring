import { lightColors, darkColors, type ThemeColors } from './colors';
export type { ThemeColors };
import { useThemeStore, type ThemePreference } from './themeStore';

export function useTheme(): ThemeColors & { isDark: boolean } {
  const preference = useThemeStore((s) => s.preference);
  const isDark = resolveIsDark(preference);
  const colors = isDark ? darkColors : lightColors;
  return { ...colors, isDark };
}

export function resolveIsDark(preference: ThemePreference): boolean {
  return preference === 'dark';
}
