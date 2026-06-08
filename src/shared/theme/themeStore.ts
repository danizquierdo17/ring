import { create } from 'zustand';

export type ThemePreference = 'light' | 'dark';

type ThemeStore = {
  preference: ThemePreference;
  isHydrated: boolean;
  setPreference: (p: ThemePreference) => void;
  hydrate: (p: ThemePreference) => void;
};

export const useThemeStore = create<ThemeStore>((set) => ({
  preference: 'light',
  isHydrated: false,
  setPreference: (preference) => set({ preference }),
  hydrate: (preference) => set({ preference, isHydrated: true }),
}));
