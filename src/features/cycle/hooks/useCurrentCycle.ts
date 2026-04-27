import { useEffect, useCallback } from "react";
import { useSQLiteContext } from "expo-sqlite";

import { useCycleStore } from "./useCycleStore";
import { getActiveCycle, insertCycle, updateCycle } from "../data/cyclesRepo";
import { insertRing, removeRing } from "../domain/cycleStateMachine";
import { isOk } from "../../../shared/result";
import type { Result } from "../../../shared/result";
import type { AppError } from "../../../shared/errors";
import type { Cycle, Regimen } from "../domain/cycleStateMachine";

// En Fase 3 se leerá de settingsRepo.get('regimen.default')
const DEFAULT_REGIMEN: Regimen = "CYCLIC_21_7";

export function useCurrentCycle() {
  const db = useSQLiteContext();

  const isLoading = useCycleStore((s) => s.isLoading);
  const currentCycle = useCycleStore((s) => s.currentCycle);
  const uiState = useCycleStore((s) => s.uiState);
  const _setLoading = useCycleStore((s) => s._setLoading);
  const _setCycle = useCycleStore((s) => s._setCycle);

  // Carga el ciclo activo al montar — una sola vez
  useEffect(() => {
    const result = getActiveCycle(db);
    if (isOk(result)) {
      _setCycle(result.value, new Date().toISOString());
    }
    _setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Inserta un nuevo anillo. `now` se captura en el momento de la llamada,
   * no en el render, para evitar bugs con la app en segundo plano.
   */
  const insertRingAction = useCallback((): Result<Cycle, AppError> => {
    const now = new Date().toISOString();

    const domainResult = insertRing(now, DEFAULT_REGIMEN, undefined, currentCycle);
    if (!isOk(domainResult)) return domainResult;

    const repoResult = insertCycle(db, {
      regimen: domainResult.value.regimen,
      insertedAt: domainResult.value.insertedAt,
      plannedRemovalAt: domainResult.value.plannedRemovalAt,
      notes: domainResult.value.notes,
    });

    if (isOk(repoResult)) {
      _setCycle(repoResult.value, now);
    }

    return repoResult;
  }, [db, currentCycle, _setCycle]);

  /**
   * Retira el anillo activo. `now` se captura al ejecutar la acción.
   */
  const removeRingAction = useCallback((): Result<Cycle, AppError> => {
    const now = new Date().toISOString();

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
      _setCycle(repoResult.value, now);
    }

    return repoResult;
  }, [db, currentCycle, _setCycle]);

  return { isLoading, currentCycle, uiState, insertRingAction, removeRingAction };
}
