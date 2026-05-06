import { create } from 'zustand';

export type ThemePreference = 'light' | 'dark';

type ThemeStore = {
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
};

export const useThemeStore = create<ThemeStore>((set) => ({
  preference: 'light',
  setPreference: (preference) => set({ preference }),
}));
