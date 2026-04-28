/**
 * @jest-environment node
 */

import { planNotifications } from "./notificationPlanner";
import type { Cycle } from "../../cycle/domain/cycleStateMachine";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCycle(overrides: Partial<Cycle> & {
  id: string;
  insertedAt: string;
  plannedRemovalAt: string;
}): Cycle {
  return {
    regimen: "CYCLIC_21_7",
    removedAt: null,
    status: "ACTIVE",
    notes: null,
    createdAt: overrides.insertedAt,
    updatedAt: overrides.insertedAt,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Fixtures
//
// All dates UTC+0 so triggerAt arithmetic is exact in tests.
// ---------------------------------------------------------------------------

// Cycle inserted 2025-01-01, plannedRemovalAt 2025-01-22 00:00 UTC
const ACTIVE_CYCLE = makeCycle({
  id: "cycle-abc",
  insertedAt: "2025-01-01T10:00:00.000Z",
  plannedRemovalAt: "2025-01-22T00:00:00.000Z",
  status: "ACTIVE",
});

// Completed CYCLIC_21_7: removed 2025-01-21, free window ends 2025-01-28
const COMPLETED_CYCLIC = makeCycle({
  id: "cycle-def",
  insertedAt: "2025-01-01T10:00:00.000Z",
  plannedRemovalAt: "2025-01-22T00:00:00.000Z",
  removedAt: "2025-01-21T18:00:00.000Z",
  status: "COMPLETED",
  regimen: "CYCLIC_21_7",
});

// Completed CONTINUOUS: no free window → no insertion reminder
const COMPLETED_CONTINUOUS = makeCycle({
  id: "cycle-ghi",
  regimen: "CONTINUOUS",
  insertedAt: "2025-01-01T10:00:00.000Z",
  plannedRemovalAt: "2025-01-29T00:00:00.000Z",
  removedAt: "2025-01-28T18:00:00.000Z",
  status: "COMPLETED",
});

// ---------------------------------------------------------------------------
// IDs deterministas
// ---------------------------------------------------------------------------

describe("notificationPlanner — IDs deterministas", () => {
  it("genera IDs con el prefijo y cycleId correctos (removal)", () => {
    const notifs = planNotifications(ACTIVE_CYCLE, 0);
    const ids = notifs.map((n) => n.id);
    expect(ids).toContain(`removal-cycle-abc-24h`);
    expect(ids).toContain(`removal-cycle-abc-0h`);
  });

  it("genera IDs de insertion para COMPLETED CYCLIC_21_7", () => {
    const notifs = planNotifications(COMPLETED_CYCLIC, 0);
    const ids = notifs.map((n) => n.id);
    expect(ids).toContain(`insertion-cycle-def-24h`);
    expect(ids).toContain(`insertion-cycle-def-0h`);
  });

  it("no duplica IDs — todos son únicos", () => {
    const notifs = planNotifications(ACTIVE_CYCLE, 0);
    const ids = notifs.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ---------------------------------------------------------------------------
// Ciclo ACTIVE — avisos de retirada
// ---------------------------------------------------------------------------

describe("notificationPlanner — ciclo ACTIVE", () => {
  // UTC+0: plannedRemovalAt = 2025-01-22T00:00Z → day = Jan 22
  // T-24h at 09:00 local (UTC+0) = 2025-01-21T09:00:00.000Z
  // T-0h  at 09:00 local (UTC+0) = 2025-01-22T09:00:00.000Z

  it("planifica aviso T-24h el día antes de plannedRemovalAt a las 09:00 local", () => {
    const notifs = planNotifications(ACTIVE_CYCLE, 0);
    const n = notifs.find((x) => x.id === "removal-cycle-abc-24h");
    expect(n).toBeDefined();
    expect(n!.triggerAt).toBe("2025-01-21T09:00:00.000Z");
  });

  it("planifica aviso T-0h en el día de plannedRemovalAt a las 09:00 local", () => {
    const notifs = planNotifications(ACTIVE_CYCLE, 0);
    const n = notifs.find((x) => x.id === "removal-cycle-abc-0h");
    expect(n).toBeDefined();
    expect(n!.triggerAt).toBe("2025-01-22T09:00:00.000Z");
  });

  it("devuelve exactamente 2 notificaciones para ciclo ACTIVE", () => {
    const notifs = planNotifications(ACTIVE_CYCLE, 0);
    expect(notifs).toHaveLength(2);
  });

  it("aplica correctamente el offset UTC+60 (UTC+1)", () => {
    // 09:00 UTC+1 = 08:00 UTC
    const notifs = planNotifications(ACTIVE_CYCLE, 60);
    const n24 = notifs.find((x) => x.id === "removal-cycle-abc-24h");
    expect(n24!.triggerAt).toBe("2025-01-21T08:00:00.000Z");
    const n0 = notifs.find((x) => x.id === "removal-cycle-abc-0h");
    expect(n0!.triggerAt).toBe("2025-01-22T08:00:00.000Z");
  });

  it("aplica correctamente el offset UTC-300 (UTC-5)", () => {
    // 09:00 UTC-5 = 14:00 UTC
    const notifs = planNotifications(ACTIVE_CYCLE, -300);
    const n0 = notifs.find((x) => x.id === "removal-cycle-abc-0h");
    expect(n0!.triggerAt).toBe("2025-01-22T14:00:00.000Z");
  });

  it("título y body están presentes y no están vacíos", () => {
    const notifs = planNotifications(ACTIVE_CYCLE, 0);
    for (const n of notifs) {
      expect(n.title.length).toBeGreaterThan(0);
      expect(n.body.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Ciclo COMPLETED CYCLIC_21_7 — aviso de reinserción
// ---------------------------------------------------------------------------

describe("notificationPlanner — COMPLETED CYCLIC_21_7", () => {
  // removedAt = 2025-01-21T18:00:00.000Z
  // plannedInsertionAt = Jan 21 UTC midnight + 7 days = Jan 28
  // T-24h (insertion-24h) = Jan 27 at 09:00 UTC+0 = 2025-01-27T09:00:00.000Z
  // T-0h  (insertion-0h)  = Jan 28 at 09:00 UTC+0 = 2025-01-28T09:00:00.000Z

  it("planifica aviso de reinserción T-24h (día antes de la inserción)", () => {
    const notifs = planNotifications(COMPLETED_CYCLIC, 0);
    const n = notifs.find((x) => x.id === "insertion-cycle-def-24h");
    expect(n).toBeDefined();
    expect(n!.triggerAt).toBe("2025-01-27T09:00:00.000Z");
  });

  it("planifica aviso de reinserción T-0h (día de la inserción)", () => {
    const notifs = planNotifications(COMPLETED_CYCLIC, 0);
    const n = notifs.find((x) => x.id === "insertion-cycle-def-0h");
    expect(n).toBeDefined();
    expect(n!.triggerAt).toBe("2025-01-28T09:00:00.000Z");
  });

  it("devuelve exactamente 2 notificaciones para COMPLETED CYCLIC_21_7", () => {
    const notifs = planNotifications(COMPLETED_CYCLIC, 0);
    expect(notifs).toHaveLength(2);
  });

  it("aplica el offset correctamente para la notif de reinserción", () => {
    // UTC+60 → 08:00 UTC
    const notifs = planNotifications(COMPLETED_CYCLIC, 60);
    const n24h = notifs.find((x) => x.id === "insertion-cycle-def-24h");
    const n0h  = notifs.find((x) => x.id === "insertion-cycle-def-0h");
    expect(n24h!.triggerAt).toBe("2025-01-27T08:00:00.000Z");
    expect(n0h!.triggerAt).toBe("2025-01-28T08:00:00.000Z");
  });
});

// ---------------------------------------------------------------------------
// Ciclo COMPLETED CONTINUOUS — sin ventana libre
// ---------------------------------------------------------------------------

describe("notificationPlanner — COMPLETED CONTINUOUS", () => {
  it("devuelve array vacío para ciclo COMPLETED CONTINUOUS", () => {
    const notifs = planNotifications(COMPLETED_CONTINUOUS, 0);
    expect(notifs).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Caso extremo — plannedRemovalAt en el pasado
// ---------------------------------------------------------------------------

describe("notificationPlanner — triggerAt en el pasado", () => {
  it("incluye las notificaciones aunque su triggerAt haya pasado (el scheduler decide si las descarta)", () => {
    const pastCycle = makeCycle({
      id: "cycle-past",
      insertedAt: "2020-01-01T10:00:00.000Z",
      plannedRemovalAt: "2020-01-22T00:00:00.000Z",
      status: "ACTIVE",
    });
    const notifs = planNotifications(pastCycle, 0);
    // El planner devuelve todas; el scheduler filtra las del pasado
    expect(notifs).toHaveLength(2);
  });
});
