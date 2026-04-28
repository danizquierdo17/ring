import { useState, useCallback, useEffect } from "react";
import { useSQLiteContext } from "expo-sqlite";

import {
  getSettings,
  updateRegimen,
  updateContinuousDays,
  type Settings,
} from "../data/settingsRepo";
import { isOk } from "../../../shared/result";
import type { AppError } from "../../../shared/errors";
import type { Regimen } from "../../cycle/domain/cycleStateMachine";

type SettingsState = {
  settings: Settings | null;
  isLoading: boolean;
};

export function useSettings() {
  const db = useSQLiteContext();
  const [state, setState] = useState<SettingsState>({
    settings: null,
    isLoading: true,
  });

  useEffect(() => {
    const result = getSettings(db);
    if (isOk(result)) {
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

  return { ...state, setRegimen, setContinuousDays };
}
