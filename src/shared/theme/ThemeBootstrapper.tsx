import { type ReactNode } from 'react';
import { useSQLiteContext } from 'expo-sqlite';

import { getSettings } from '../../features/settings/data/settingsRepo';
import { isOk } from '../result';
import { useThemeStore } from './themeStore';
import { useLanguageStore } from '../i18n/languageStore';

type Props = { children: ReactNode };

export function ThemeBootstrapper({ children }: Props) {
  const db = useSQLiteContext();
  const isHydrated = useThemeStore((s) => s.isHydrated);

  if (!isHydrated) {
    const result = getSettings(db);
    if (isOk(result)) {
      useThemeStore.getState().hydrate(result.value.theme);
      useLanguageStore.getState().setLocale(result.value.language);
    } else {
      useThemeStore.getState().hydrate('light');
    }
    return null;
  }

  return <>{children}</>;
}
