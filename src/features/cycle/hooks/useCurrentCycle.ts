import { useEffect, useCallback } from "react";
import { useSQLiteContext } from "expo-sqlite";

import { useCycleStore } from "./useCycleStore";
import { getActiveCycle, getCurrentCycle, insertCycle, updateCycle } from "../data/cyclesRepo";
import { insertRing, removeRing } from "../domain/cycleStateMachine";
import { isOk } from "../../../shared/result";
import type { Result } from "../../../shared/result";
import type { AppError } from "../../../shared/errors";
import type { Cycle, Regimen } from "../domain/cycleStateMachine";
import { reconcileNotifications } from "../../notifications/hooks/useNotificationsReconciliation";
import { getSettings } from "../../settings/data/settingsRepo";

export function useCurrentCycle() {
  const db = useSQLiteContext();

  const isLoading = useCycleStore((s) => s.isLoading);
  const currentCycle = useCycleStore((s) => s.currentCycle);
  const uiState = useCycleStore((s) => s.uiState);
  const _setLoading = useCycleStore((s) => s._setLoading);
  const _setCycle = useCycleStore((s) => s._setCycle);

  useEffect(() => {
    const result = getCurrentCycle(db);
    if (isOk(result)) {
      _setCycle(result.value, new Date().toISOString());
    }
    _setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Inserta un nuevo anillo con el timestamp elegido por la usuaria.
   * Lee el régimen y días configurados en Settings.
   */
  const insertRingAction = useCallback((chosenAt?: string): Result<Cycle, AppError> => {
    const now = chosenAt ?? new Date().toISOString();

    const settingsResult = getSettings(db);
    const regimen: Regimen = isOk(settingsResult)
      ? settingsResult.value.regimen
      : "CYCLIC_21_7";
    const continuousDays = isOk(settingsResult)
      ? settingsResult.value.continuousDays
      : undefined;

    const domainResult = insertRing(now, regimen, continuousDays, currentCycle);
    if (!isOk(domainResult)) return domainResult;

    const repoResult = insertCycle(db, {
      regimen,
      insertedAt: domainResult.value.insertedAt,
      plannedRemovalAt: domainResult.value.plannedRemovalAt,
      notes: domainResult.value.notes,
    });

    if (isOk(repoResult)) {
      _setCycle(repoResult.value, new Date().toISOString());
      void reconcileNotifications(db);
    }

    return repoResult;
  }, [db, currentCycle, _setCycle]);

  /**
   * Retira el anillo activo con el timestamp elegido por la usuaria.
   */
  /**
   * Re-reads the active cycle from the database and updates the store.
   * Call this after any external mutation (e.g. calendar timestamp edit).
   */
  const refreshCycle = useCallback(() => {
    const result = getCurrentCycle(db);
    if (isOk(result)) {
      _setCycle(result.value, new Date().toISOString());
    }
  }, [db, _setCycle]);

  const removeRingAction = useCallback((chosenAt?: string): Result<Cycle, AppError> => {
    const now = chosenAt ?? new Date().toISOString();

    if (!currentCycle) {
      return {
        ok: false,
        error: { code: "CYCLE_NOT_ACTIVE", message: "No hay ciclo activo para retirar." },
      };
    }

    const domainResult = removeRing(currentCycle, now);
    if (!isOk(domainResult)) return domainResult;

    const repoResult = updateCycle(db, domainResult.value);

    if (isOk(repoResult)) {
      _setCycle(repoResult.value, new Date().toISOString());
      void reconcileNotifications(db);
    }

    return repoResult;
  }, [db, currentCycle, _setCycle]);

  return { isLoading, currentCycle, uiState, insertRingAction, removeRingAction, refreshCycle };
}
