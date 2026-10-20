/**
 * @jest-environment node
 */

import { planNotifications, planBuyReminders, type BuyReminderStock, type UtcOffsetAt } from "./notificationPlanner";
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

/** Desfase fijo, sin cambios de hora. */
const fixedOffset = (minutes: number): UtcOffsetAt => () => minutes;

/**
 * Europe/Madrid: UTC+2 hasta el 25 oct 2026 a las 01:00Z (03:00 → 02:00),
 * UTC+1 hasta el 28 mar 2027 a las 01:00Z (02:00 → 03:00), UTC+2 después.
 */
const MADRID: UtcOffsetAt = (isoUtc) => {
  const t = Date.parse(isoUtc);
  return t >= Date.parse("2026-10-25T01:00:00.000Z") && t < Date.parse("2027-03-28T01:00:00.000Z")
    ? 60
    : 120;
};

function triggersById(notifs: { id: string; triggerAt: string }[]): Record<string, string> {
  return Object.fromEntries(notifs.map((n) => [n.id, n.triggerAt]));
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

// Retirada prevista el 22 ene 2025 a las 20:00Z
const ACTIVE_CYCLE = makeCycle({
  id: "cycle-abc",
  insertedAt: "2025-01-01T20:00:00.000Z",
  plannedRemovalAt: "2025-01-22T20:00:00.000Z",
  status: "ACTIVE",
});

// Retirado el 21 ene 2025 a las 18:00Z → inserción prevista el 28 ene a las 18:00Z
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
    const ids = planNotifications(ACTIVE_CYCLE, fixedOffset(0)).map((n) => n.id);
    expect(ids).toContain("removal-cycle-abc-day-before");
    expect(ids).toContain("removal-cycle-abc-due");
  });

  it("genera IDs de insertion para COMPLETED CYCLIC_21_7", () => {
    const ids = planNotifications(COMPLETED_CYCLIC, fixedOffset(0)).map((n) => n.id);
    expect(ids).toContain("insertion-cycle-def-day-before");
    expect(ids).toContain("insertion-cycle-def-due");
  });

  it("no duplica IDs — todos son únicos", () => {
    const ids = planNotifications(ACTIVE_CYCLE, fixedOffset(0)).map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ---------------------------------------------------------------------------
// Ciclo ACTIVE — avisos de retirada
// ---------------------------------------------------------------------------

describe("notificationPlanner — ciclo ACTIVE", () => {
  it("con UTC+0 avisa a las 12:00 del día antes, a las 09:00 del día y en torno a la hora prevista", () => {
    expect(triggersById(planNotifications(ACTIVE_CYCLE, fixedOffset(0)))).toEqual({
      "removal-cycle-abc-day-before": "2025-01-21T12:00:00.000Z",
      "removal-cycle-abc-same-day-morning": "2025-01-22T09:00:00.000Z",
      "removal-cycle-abc-pre": "2025-01-22T19:00:00.000Z",
      "removal-cycle-abc-due": "2025-01-22T20:00:00.000Z",
      "removal-cycle-abc-follow-up-1h": "2025-01-22T21:00:00.000Z",
      "removal-cycle-abc-follow-up-3h": "2025-01-22T23:00:00.000Z",
    });
  });

  it("aplica correctamente el offset UTC+60 (UTC+1)", () => {
    const t = triggersById(planNotifications(ACTIVE_CYCLE, fixedOffset(60)));
    expect(t["removal-cycle-abc-day-before"]).toBe("2025-01-21T11:00:00.000Z");
    expect(t["removal-cycle-abc-same-day-morning"]).toBe("2025-01-22T08:00:00.000Z");
  });

  it("aplica correctamente el offset UTC-300 (UTC-5)", () => {
    const t = triggersById(planNotifications(ACTIVE_CYCLE, fixedOffset(-300)));
    expect(t["removal-cycle-abc-day-before"]).toBe("2025-01-21T17:00:00.000Z");
    expect(t["removal-cycle-abc-same-day-morning"]).toBe("2025-01-22T14:00:00.000Z");
  });

  it("omite el aviso de las 09:00 si la hora prevista es anterior", () => {
    const early = makeCycle({
      id: "cycle-early",
      insertedAt: "2025-01-01T07:00:00.000Z",
      plannedRemovalAt: "2025-01-22T07:00:00.000Z",
    });
    const ids = planNotifications(early, fixedOffset(0)).map((n) => n.id);
    expect(ids).not.toContain("removal-cycle-early-same-day-morning");
    expect(ids).toHaveLength(5);
  });

  it("título y body están presentes y no están vacíos", () => {
    for (const n of planNotifications(ACTIVE_CYCLE, fixedOffset(0))) {
      expect(n.title.length).toBeGreaterThan(0);
      expect(n.body.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Ciclo COMPLETED CYCLIC_21_7 — aviso de reinserción
// ---------------------------------------------------------------------------

describe("notificationPlanner — COMPLETED CYCLIC_21_7", () => {
  it("con UTC+0 avisa a las 12:00 del día antes, a las 09:00 del día y en torno a la inserción prevista", () => {
    expect(triggersById(planNotifications(COMPLETED_CYCLIC, fixedOffset(0)))).toEqual({
      "insertion-cycle-def-day-before": "2025-01-27T12:00:00.000Z",
      "insertion-cycle-def-same-day-morning": "2025-01-28T09:00:00.000Z",
      "insertion-cycle-def-pre": "2025-01-28T17:00:00.000Z",
      "insertion-cycle-def-due": "2025-01-28T18:00:00.000Z",
      "insertion-cycle-def-follow-up-1h": "2025-01-28T19:00:00.000Z",
      "insertion-cycle-def-follow-up-3h": "2025-01-28T21:00:00.000Z",
    });
  });

  it("aplica el offset correctamente para la notif de reinserción", () => {
    const t = triggersById(planNotifications(COMPLETED_CYCLIC, fixedOffset(60)));
    expect(t["insertion-cycle-def-day-before"]).toBe("2025-01-27T11:00:00.000Z");
    expect(t["insertion-cycle-def-same-day-morning"]).toBe("2025-01-28T08:00:00.000Z");
  });
});

// ---------------------------------------------------------------------------
// Ciclo COMPLETED CONTINUOUS — sin ventana libre
// ---------------------------------------------------------------------------

describe("notificationPlanner — COMPLETED CONTINUOUS", () => {
  it("devuelve array vacío para ciclo COMPLETED CONTINUOUS", () => {
    expect(planNotifications(COMPLETED_CONTINUOUS, fixedOffset(0))).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Día local ≠ día UTC
// ---------------------------------------------------------------------------

describe("notificationPlanner — día natural local", () => {
  it("UTC-5: una retirada a las 20:00 locales cae en el día local, no en el día UTC siguiente", () => {
    // 2025-01-22T01:00Z = 21 ene a las 20:00 en UTC-5
    const evening = makeCycle({
      id: "cycle-evening",
      insertedAt: "2025-01-01T01:00:00.000Z",
      plannedRemovalAt: "2025-01-22T01:00:00.000Z",
    });
    const t = triggersById(planNotifications(evening, fixedOffset(-300)));
    expect(t["removal-cycle-evening-day-before"]).toBe("2025-01-20T17:00:00.000Z"); // 20 ene 12:00 local
    expect(t["removal-cycle-evening-same-day-morning"]).toBe("2025-01-21T14:00:00.000Z"); // 21 ene 09:00 local
  });

  it("UTC+2: una retirada de madrugada cae en el día local, no en el día UTC anterior", () => {
    // 2026-07-14T23:30Z = 15 jul a la 01:30 en UTC+2
    const night = makeCycle({
      id: "cycle-night",
      insertedAt: "2026-06-23T23:30:00.000Z",
      plannedRemovalAt: "2026-07-14T23:30:00.000Z",
    });
    const t = triggersById(planNotifications(night, fixedOffset(120)));
    expect(t["removal-cycle-night-day-before"]).toBe("2026-07-14T10:00:00.000Z"); // 14 jul 12:00 local
    expect(t["removal-cycle-night-same-day-morning"]).toBeUndefined(); // 15 jul 09:00 es posterior
  });
});

// ---------------------------------------------------------------------------
// Cambio de hora (Europe/Madrid)
// ---------------------------------------------------------------------------

describe("notificationPlanner — cambio de hora", () => {
  it("retirada después del cambio de octubre: 12:00 y 09:00 en hora de invierno", () => {
    // Retirada prevista el 26 oct a las 20:00 CET; antes salían a las 11:00 y 08:00.
    const cycle = makeCycle({
      id: "cycle-oct",
      insertedAt: "2026-10-05T18:00:00.000Z",
      plannedRemovalAt: "2026-10-26T19:00:00.000Z",
    });
    expect(triggersById(planNotifications(cycle, MADRID))).toEqual({
      "removal-cycle-oct-day-before": "2026-10-25T11:00:00.000Z", // 25 oct 12:00 CET
      "removal-cycle-oct-same-day-morning": "2026-10-26T08:00:00.000Z", // 26 oct 09:00 CET
      "removal-cycle-oct-pre": "2026-10-26T18:00:00.000Z",
      "removal-cycle-oct-due": "2026-10-26T19:00:00.000Z",
      "removal-cycle-oct-follow-up-1h": "2026-10-26T20:00:00.000Z",
      "removal-cycle-oct-follow-up-3h": "2026-10-26T22:00:00.000Z",
    });
  });

  it("retirada el mismo día del cambio: el día antes en verano y el aviso de las 09:00 en invierno", () => {
    const cycle = makeCycle({
      id: "cycle-dst-day",
      insertedAt: "2026-10-04T18:00:00.000Z",
      plannedRemovalAt: "2026-10-25T19:00:00.000Z", // 25 oct 20:00 CET
    });
    const t = triggersById(planNotifications(cycle, MADRID));
    expect(t["removal-cycle-dst-day-day-before"]).toBe("2026-10-24T10:00:00.000Z"); // 24 oct 12:00 CEST
    expect(t["removal-cycle-dst-day-same-day-morning"]).toBe("2026-10-25T08:00:00.000Z"); // 25 oct 09:00 CET
  });

  it("reinserción después del cambio de octubre: 12:00 y 09:00 en hora de invierno", () => {
    // Retirado el 20 oct a las 20:00 CEST → inserción 7×24 h después (27 oct, 19:00 CET)
    const cycle = makeCycle({
      id: "cycle-ins",
      insertedAt: "2026-09-29T18:00:00.000Z",
      plannedRemovalAt: "2026-10-20T18:00:00.000Z",
      removedAt: "2026-10-20T18:00:00.000Z",
      status: "COMPLETED",
    });
    const t = triggersById(planNotifications(cycle, MADRID));
    expect(t["insertion-cycle-ins-day-before"]).toBe("2026-10-26T11:00:00.000Z"); // 26 oct 12:00 CET
    expect(t["insertion-cycle-ins-same-day-morning"]).toBe("2026-10-27T08:00:00.000Z"); // 27 oct 09:00 CET
    expect(t["insertion-cycle-ins-due"]).toBe("2026-10-27T18:00:00.000Z");
  });

  it("retirada después del cambio de marzo: 12:00 y 09:00 en hora de verano", () => {
    const cycle = makeCycle({
      id: "cycle-mar",
      insertedAt: "2027-03-08T19:00:00.000Z",
      plannedRemovalAt: "2027-03-29T18:00:00.000Z", // 29 mar 20:00 CEST
    });
    const t = triggersById(planNotifications(cycle, MADRID));
    expect(t["removal-cycle-mar-day-before"]).toBe("2027-03-28T10:00:00.000Z"); // 28 mar 12:00 CEST
    expect(t["removal-cycle-mar-same-day-morning"]).toBe("2027-03-29T07:00:00.000Z"); // 29 mar 09:00 CEST
  });
});

// ---------------------------------------------------------------------------
// Caso extremo — plannedRemovalAt en el pasado
// ---------------------------------------------------------------------------

describe("notificationPlanner — triggerAt en el pasado", () => {
  it("incluye las notificaciones aunque su triggerAt haya pasado (el scheduler decide si las descarta)", () => {
    const pastCycle = makeCycle({
      id: "cycle-past",
      insertedAt: "2020-01-01T20:00:00.000Z",
      plannedRemovalAt: "2020-01-22T20:00:00.000Z",
      status: "ACTIVE",
    });
    // El planner devuelve todas; el scheduler filtra las del pasado
    expect(planNotifications(pastCycle, fixedOffset(0))).toHaveLength(6);
  });
});

// ---------------------------------------------------------------------------
// planBuyReminders
// ---------------------------------------------------------------------------

describe("planBuyReminders", () => {
  const OFFSET = () => 60; // UTC+1 fijo (Madrid, invierno)
  const copy = {
    title: "Lua Ring",
    body: (count: number, buyByAt: string) => `${count}|${buyByAt}`,
  };

  // Retirado el 5 nov a las 20:00Z → próxima inserción 12 nov 20:00Z (21:00 local)
  const ringFree = makeCycle({
    id: "c-free",
    insertedAt: "2026-10-15T20:00:00.000Z",
    plannedRemovalAt: "2026-11-05T20:00:00.000Z",
    removedAt: "2026-11-05T20:00:00.000Z",
    status: "COMPLETED",
  });

  function stock(overrides: Partial<BuyReminderStock> = {}): BuyReminderStock {
    return { count: 1, threshold: 1, buyReminderHours: [24], daysPerRing: 28, configured: true, ...overrides };
  }

  const NOW = "2026-11-08T12:00:00.000Z";

  it("con una antelación, avisa 24 h antes de las 10:00 locales del día límite", () => {
    const notifs = planBuyReminders(ringFree, stock(), NOW, OFFSET, copy);

    expect(notifs).toEqual([
      {
        id: "buy-rings-24h",
        triggerAt: "2026-11-11T09:00:00.000Z",
        title: "Lua Ring",
        body: "1|2026-11-12T09:00:00.000Z",
      },
    ]);
  });

  it("con dos antelaciones, programa un aviso por cada una", () => {
    const notifs = planBuyReminders(ringFree, stock({ buyReminderHours: [48, 24] }), NOW, OFFSET, copy);

    expect(notifs.map((n) => [n.id, n.triggerAt])).toEqual([
      ["buy-rings-48h", "2026-11-10T09:00:00.000Z"],
      ["buy-rings-24h", "2026-11-11T09:00:00.000Z"],
    ]);
  });

  it("con tres antelaciones, programa los tres avisos", () => {
    const notifs = planBuyReminders(ringFree, stock({ buyReminderHours: [72, 48, 24] }), NOW, OFFSET, copy);

    expect(notifs.map((n) => n.id)).toEqual(["buy-rings-72h", "buy-rings-48h", "buy-rings-24h"]);
    expect(notifs[0]?.triggerAt).toBe("2026-11-09T09:00:00.000Z");
  });

  it("omite los avisos cuya hora ya ha pasado", () => {
    const now = "2026-11-10T12:00:00.000Z";
    const notifs = planBuyReminders(ringFree, stock({ buyReminderHours: [72, 48, 24] }), now, OFFSET, copy);

    expect(notifs.map((n) => n.id)).toEqual(["buy-rings-24h"]);
  });

  it("no programa nada si la reserva no está baja", () => {
    const notifs = planBuyReminders(ringFree, stock({ count: 2, threshold: 1, buyReminderHours: [72, 48, 24] }), NOW, OFFSET, copy);

    expect(notifs).toEqual([]);
  });

  it("no programa nada si la reserva nunca se ha guardado", () => {
    const notifs = planBuyReminders(ringFree, stock({ count: 0, configured: false }), NOW, OFFSET, copy);

    expect(notifs).toEqual([]);
  });

  it("con reserva 0, la fecha límite es la próxima inserción", () => {
    // Anillo puesto: retirada prevista 10 nov 20:00Z → inserción 17 nov 20:00Z
    const inUse = makeCycle({
      id: "c-use",
      insertedAt: "2026-10-20T20:00:00.000Z",
      plannedRemovalAt: "2026-11-10T20:00:00.000Z",
    });

    const notifs = planBuyReminders(inUse, stock({ count: 0, threshold: 0 }), NOW, OFFSET, copy);

    expect(notifs).toEqual([
      {
        id: "buy-rings-24h",
        triggerAt: "2026-11-16T09:00:00.000Z",
        title: "Lua Ring",
        body: "0|2026-11-17T09:00:00.000Z",
      },
    ]);
  });

  it("mantiene las 10:00 locales aunque haya cambio de hora entre medias", () => {
    // Madrid: UTC+2 hasta el 25 oct 2026 a las 01:00Z, UTC+1 después.
    const madrid = (iso: string) => (iso < "2026-10-25T01:00:00.000Z" ? 120 : 60);
    // Retirado el 19 oct → inserción 26 oct 20:00Z (21:00 local, ya en horario de invierno)
    const freeAcrossDst = makeCycle({
      id: "c-dst",
      insertedAt: "2026-09-28T20:00:00.000Z",
      plannedRemovalAt: "2026-10-19T20:00:00.000Z",
      removedAt: "2026-10-19T20:00:00.000Z",
      status: "COMPLETED",
    });

    const notifs = planBuyReminders(
      freeAcrossDst,
      stock({ buyReminderHours: [72, 48, 24] }),
      "2026-10-20T12:00:00.000Z",
      madrid,
      copy,
    );

    expect(notifs.map((n) => n.triggerAt)).toEqual([
      "2026-10-23T08:00:00.000Z", // 10:00 CEST
      "2026-10-24T08:00:00.000Z", // 10:00 CEST
      "2026-10-25T09:00:00.000Z", // 10:00 CET
    ]);
    expect(notifs[0]?.body).toBe("1|2026-10-26T09:00:00.000Z");
  });

  it("usa el día local de la fecha límite, no el día UTC", () => {
    // Retirada 5 nov 23:30Z = 6 nov 00:30 local → inserción 13 nov local
    const lateNight = makeCycle({
      id: "c-night",
      insertedAt: "2026-10-15T23:30:00.000Z",
      plannedRemovalAt: "2026-11-05T23:30:00.000Z",
      removedAt: "2026-11-05T23:30:00.000Z",
      status: "COMPLETED",
    });

    const notifs = planBuyReminders(lateNight, stock(), NOW, OFFSET, copy);

    expect(notifs[0]?.triggerAt).toBe("2026-11-12T09:00:00.000Z");
  });
});
