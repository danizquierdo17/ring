import { create } from 'zustand';
import type { Locale } from './translations';

type LanguageStore = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

export const useLanguageStore = create<LanguageStore>((set) => ({
  locale: 'es-ES',
  setLocale: (locale) => set({ locale }),
}));
