/**
 * @jest-environment node
 */
import { useCycleStore } from "./useCycleStore";
import type { Cycle } from "../domain/cycleStateMachine";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeActiveCycle(insertedAt: string): Cycle {
  const planned = new Date(insertedAt);
  planned.setUTCDate(planned.getUTCDate() + 21);
  return {
    id: "test-id",
    regimen: "CYCLIC_21_7",
    insertedAt,
    removedAt: null,
    plannedRemovalAt: planned.toISOString(),
    status: "ACTIVE",
    notes: null,
    createdAt: insertedAt,
    updatedAt: insertedAt,
  };
}

function makeCompletedCycle(insertedAt: string, removedAt: string): Cycle {
  return {
    id: "test-id",
    regimen: "CYCLIC_21_7",
    insertedAt,
    removedAt,
    plannedRemovalAt: removedAt,
    status: "COMPLETED",
    notes: null,
    createdAt: insertedAt,
    updatedAt: removedAt,
  };
}

// ---------------------------------------------------------------------------
// Reset entre tests — el store de Zustand es un singleton
// ---------------------------------------------------------------------------

beforeEach(() => {
  useCycleStore.setState({ isLoading: true, currentCycle: null, uiState: "NO_RING" });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useCycleStore — estado inicial", () => {
  it("arranca con isLoading=true, sin ciclo y uiState=NO_RING", () => {
    const { isLoading, currentCycle, uiState } = useCycleStore.getState();
    expect(isLoading).toBe(true);
    expect(currentCycle).toBeNull();
    expect(uiState).toBe("NO_RING");
  });
});

describe("useCycleStore — _setLoading", () => {
  it("pone isLoading en false sin alterar el resto del estado", () => {
    useCycleStore.getState()._setLoading(false);
    const { isLoading, currentCycle, uiState } = useCycleStore.getState();
    expect(isLoading).toBe(false);
    expect(currentCycle).toBeNull();
    expect(uiState).toBe("NO_RING");
  });
});

describe("useCycleStore — _setCycle", () => {
  it("ciclo ACTIVE → uiState = RING_IN_USE", () => {
    const now = "2026-04-15T10:00:00.000Z";
    const cycle = makeActiveCycle("2026-04-01T10:00:00.000Z");

    useCycleStore.getState()._setCycle(cycle, now);

    const state = useCycleStore.getState();
    expect(state.currentCycle).toBe(cycle);
    expect(state.uiState).toBe("RING_IN_USE");
  });

  it("null → uiState = NO_RING y currentCycle = null", () => {
    const now = "2026-04-15T10:00:00.000Z";
    // Primero ponemos un ciclo activo
    useCycleStore.getState()._setCycle(makeActiveCycle("2026-04-01T10:00:00.000Z"), now);
    // Ahora lo eliminamos
    useCycleStore.getState()._setCycle(null, now);

    const state = useCycleStore.getState();
    expect(state.currentCycle).toBeNull();
    expect(state.uiState).toBe("NO_RING");
  });

  it("ciclo COMPLETED dentro de los 7 días de descanso → RING_FREE", () => {
    const removedAt = "2026-04-10T10:00:00.000Z";
    const now = "2026-04-15T10:00:00.000Z"; // día 5 de la semana libre
    const cycle = makeCompletedCycle("2026-03-20T10:00:00.000Z", removedAt);

    useCycleStore.getState()._setCycle(cycle, now);

    expect(useCycleStore.getState().uiState).toBe("RING_FREE");
  });

  it("ciclo COMPLETED fuera de los 7 días → NO_RING", () => {
    const removedAt = "2026-04-01T10:00:00.000Z";
    const now = "2026-04-15T10:00:00.000Z"; // 14 días después
    const cycle = makeCompletedCycle("2026-03-11T10:00:00.000Z", removedAt);

    useCycleStore.getState()._setCycle(cycle, now);

    expect(useCycleStore.getState().uiState).toBe("NO_RING");
  });

  it("ciclo CONTINUOUS COMPLETED → NO_RING inmediato (sin semana libre)", () => {
    const removedAt = "2026-04-10T10:00:00.000Z";
    const now = "2026-04-12T10:00:00.000Z"; // solo 2 días después
    const cycle: Cycle = {
      ...makeCompletedCycle("2026-03-13T10:00:00.000Z", removedAt),
      regimen: "CONTINUOUS",
    };

    useCycleStore.getState()._setCycle(cycle, now);

    expect(useCycleStore.getState().uiState).toBe("NO_RING");
  });
});
