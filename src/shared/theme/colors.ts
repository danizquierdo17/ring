// Accent colors — shared across both themes
const accent = {
  indigo:      '#3A3CF6',
  indigoDark:  '#2a2bd4',
  indigoLight: '#6B6CF8',
  coral:       '#FF6B7A',
  coralDark:   '#e55464',
  emerald:     '#2ECC9A',
  emeraldDark: '#25b085',
  lavender:    '#E7E6FF',
} as const;

export const lightColors = {
  ...accent,
  // Backgrounds
  bg:          '#FFFFFF',
  bgSubtle:    '#F8F7FF',
  bgLuna:      '#faf7f2',
  // Surfaces (cards, sheets)
  surface:     '#FFFFFF',
  surfaceRaised: '#FFFFFF',
  // Borders
  border:      '#E2E8F0',  // slate200
  borderSubtle:'#F1F5F9',  // slate100
  // Text
  text:        '#1a1a2e',
  textSubtle:  '#94A3B8',  // slate400
  textMuted:   '#CBD5E1',  // slate200-ish
  // Slate shades (kept for compat)
  slate700:    '#334155',
  slate400:    '#94A3B8',
  slate200:    '#E2E8F0',
  slate100:    '#F1F5F9',
  white:       '#FFFFFF',
  // Overlay
  overlay:     'rgba(0,0,0,0.4)',
  overlayLight:'rgba(0,0,0,0.05)',
} as const;

export const darkColors = {
  ...accent,
  lavender:    '#2D2B6B',  // dark lavender — much darker purple
  // Backgrounds
  bg:          '#0F0F1A',
  bgSubtle:    '#16162A',
  bgLuna:      '#13120F',
  // Surfaces
  surface:     '#1C1C30',
  surfaceRaised: '#252540',
  // Borders
  border:      '#2E2E50',
  borderSubtle:'#1C1C30',
  // Text
  text:        '#E8E8F5',
  textSubtle:  '#6B7CA8',
  textMuted:   '#3A3A60',
  // Slate shades
  slate700:    '#A0AABF',
  slate400:    '#6B7CA8',
  slate200:    '#2E2E50',
  slate100:    '#1C1C30',
  white:       '#FFFFFF',
  // Overlay
  overlay:     'rgba(0,0,0,0.7)',
  overlayLight:'rgba(0,0,0,0.25)',
} as const;

// Legacy alias — points to light; use useTheme() for theme-aware access
export const C = lightColors;

export type ThemeColors = {
  indigo: string; indigoDark: string; indigoLight: string;
  coral: string; coralDark: string;
  emerald: string; emeraldDark: string;
  lavender: string;
  bg: string; bgSubtle: string; bgLuna: string;
  surface: string; surfaceRaised: string;
  border: string; borderSubtle: string;
  text: string; textSubtle: string; textMuted: string;
  slate700: string; slate400: string; slate200: string; slate100: string;
  white: string;
  overlay: string; overlayLight: string;
};
