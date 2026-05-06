import { useState, useCallback, useEffect } from "react";
import { useSQLiteContext } from "expo-sqlite";

import {
  getSettings,
  updateRegimen,
  updateContinuousDays,
  updateLanguage,
  updateTheme,
  type Settings,
} from "../data/settingsRepo";
import { isOk } from "../../../shared/result";
import type { AppError } from "../../../shared/errors";
import type { Regimen } from "../../cycle/domain/cycleStateMachine";
import type { Locale } from "../../../shared/i18n/translations";
import { useLanguageStore } from "../../../shared/i18n/languageStore";
import { useThemeStore, type ThemePreference } from "../../../shared/theme/themeStore";

type SettingsState = {
  settings: Settings | null;
  isLoading: boolean;
};

export function useSettings() {
  const db = useSQLiteContext();
  const setLocale = useLanguageStore((s) => s.setLocale);
  const setThemePref = useThemeStore((s) => s.setPreference);
  const [state, setState] = useState<SettingsState>({
    settings: null,
    isLoading: true,
  });

  useEffect(() => {
    const result = getSettings(db);
    if (isOk(result)) {
      setLocale(result.value.language);
      setThemePref(result.value.theme);
      setState({ settings: result.value, isLoading: false });
    } else {
      setState({ settings: null, isLoading: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setRegimen = useCallback(
    (regimen: Regimen): AppError | null => {
      const result = updateRegimen(db, regimen);
      if (isOk(result)) {
        setState((prev) => ({ ...prev, settings: result.value }));
        return null;
      }
      return result.error;
    },
    [db]
  );

  const setContinuousDays = useCallback(
    (days: number): AppError | null => {
      const result = updateContinuousDays(db, days);
      if (isOk(result)) {
        setState((prev) => ({ ...prev, settings: result.value }));
        return null;
      }
      return result.error;
    },
    [db]
  );

  const setLanguage = useCallback(
    (language: Locale): AppError | null => {
      const result = updateLanguage(db, language);
      if (isOk(result)) {
        setLocale(language);
        setState((prev) => ({ ...prev, settings: result.value }));
        return null;
      }
      return result.error;
    },
    [db, setLocale],
  );

  const setTheme = useCallback(
    (theme: ThemePreference): AppError | null => {
      const result = updateTheme(db, theme);
      if (isOk(result)) {
        setThemePref(theme);
        setState((prev) => ({ ...prev, settings: result.value }));
        return null;
      }
      return result.error;
    },
    [db, setThemePref],
  );

  return { ...state, setRegimen, setContinuousDays, setLanguage, setTheme };
}
