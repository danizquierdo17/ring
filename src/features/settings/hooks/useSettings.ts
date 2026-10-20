import { useCallback, useEffect } from "react";
import { useSQLiteContext } from "expo-sqlite";

import {
  getSettings,
  updateRegimen,
  updateContinuousDays,
  updateLanguage,
  updateTheme,
  updateStockSettings,
  type StockSettingsPatch,
} from "../data/settingsRepo";
import { useSettingsStore } from "./useSettingsStore";
import { isOk } from "../../../shared/result";
import type { AppError } from "../../../shared/errors";
import type { Regimen } from "../../cycle/domain/cycleStateMachine";
import type { Locale } from "../../../shared/i18n/translations";
import { useLanguageStore } from "../../../shared/i18n/languageStore";
import { useThemeStore, type ThemePreference } from "../../../shared/theme/themeStore";
import { reconcileNotifications } from "../../notifications/hooks/useNotificationsReconciliation";

export function useSettings() {
  const db = useSQLiteContext();
  const setLocale = useLanguageStore((s) => s.setLocale);
  const setThemePref = useThemeStore((s) => s.setPreference);
  const settings = useSettingsStore((s) => s.settings);
  const isLoading = useSettingsStore((s) => s.isLoading);
  const _setSettings = useSettingsStore((s) => s._setSettings);

  useEffect(() => {
    const result = getSettings(db);
    if (isOk(result)) {
      setLocale(result.value.language);
      setThemePref(result.value.theme);
      _setSettings(result.value);
    } else {
      _setSettings(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Re-reads Settings from the database, e.g. after a bulk reset. */
  const reloadSettings = useCallback(() => {
    const result = getSettings(db);
    if (isOk(result)) _setSettings(result.value);
  }, [db, _setSettings]);

  const setRegimen = useCallback(
    (regimen: Regimen): AppError | null => {
      const result = updateRegimen(db, regimen);
      if (isOk(result)) {
        _setSettings(result.value);
        void reconcileNotifications(db);
        return null;
      }
      return result.error;
    },
    [db, _setSettings]
  );

  const setContinuousDays = useCallback(
    (days: number): AppError | null => {
      const result = updateContinuousDays(db, days);
      if (isOk(result)) {
        _setSettings(result.value);
        void reconcileNotifications(db);
        return null;
      }
      return result.error;
    },
    [db, _setSettings]
  );

  const setLanguage = useCallback(
    (language: Locale): AppError | null => {
      const result = updateLanguage(db, language);
      if (isOk(result)) {
        setLocale(language);
        _setSettings(result.value);
        return null;
      }
      return result.error;
    },
    [db, setLocale, _setSettings],
  );

  const setTheme = useCallback(
    (theme: ThemePreference): AppError | null => {
      const result = updateTheme(db, theme);
      if (isOk(result)) {
        setThemePref(theme);
        _setSettings(result.value);
        return null;
      }
      return result.error;
    },
    [db, setThemePref, _setSettings],
  );

  /** Saves any subset of the ring stock settings and re-plans buy reminders. */
  const saveStock = useCallback(
    (patch: StockSettingsPatch): AppError | null => {
      const result = updateStockSettings(db, patch);
      if (isOk(result)) {
        _setSettings(result.value);
        void reconcileNotifications(db);
        return null;
      }
      return result.error;
    },
    [db, _setSettings],
  );

  const setStock = useCallback((count: number) => saveStock({ count }), [saveStock]);
  const setStockThreshold = useCallback((threshold: number) => saveStock({ threshold }), [saveStock]);
  const setBuyReminderHours = useCallback(
    (buyReminderHours: readonly number[]) => saveStock({ buyReminderHours }),
    [saveStock],
  );

  return {
    settings,
    isLoading,
    reloadSettings,
    setRegimen,
    setContinuousDays,
    setLanguage,
    setTheme,
    saveStock,
    setStock,
    setStockThreshold,
    setBuyReminderHours,
  };
}
