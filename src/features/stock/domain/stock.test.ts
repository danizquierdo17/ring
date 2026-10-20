/**
 * @jest-environment node
 */

import { isOk, isErr } from "../../../shared/result";
import type { Cycle } from "../../cycle/domain/cycleStateMachine";
import {
  buyBy,
  daysPerRing,
  isLowStock,
  needsBuyWarning,
  nextInsertDate,
  stockRunOut,
  validateBuyReminderHours,
  validateStockCount,
  validateStockThreshold,
} from "./stock";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const NOW = "2026-11-01T08:00:00.000Z";

function makeCycle(overrides: Partial<Cycle> = {}): Cycle {
  return {
    id: "cycle-1",
    regimen: "CYCLIC_21_7",
    insertedAt: "2026-10-20T20:00:00.000Z",
    removedAt: null,
    plannedRemovalAt: "2026-11-10T20:00:00.000Z",
    status: "ACTIVE",
    notes: null,
    createdAt: "2026-10-20T20:00:00.000Z",
    updatedAt: "2026-10-20T20:00:00.000Z",
    ...overrides,
  };
}

const inUse = makeCycle();
const ringFree = makeCycle({
  status: "COMPLETED",
  removedAt: "2026-10-30T20:00:00.000Z",
  plannedRemovalAt: "2026-10-30T20:00:00.000Z",
});
const continuousInUse = makeCycle({ regimen: "CONTINUOUS" });

// ---------------------------------------------------------------------------
// daysPerRing
// ---------------------------------------------------------------------------

describe("daysPerRing", () => {
  it("en pauta cíclica cada anillo dura 21 + 7 días", () => {
    expect(daysPerRing("CYCLIC_21_7", 40)).toBe(28);
  });

  it("en pauta continua usa los días configurados", () => {
    expect(daysPerRing("CONTINUOUS", 35)).toBe(35);
  });
});

// ---------------------------------------------------------------------------
// nextInsertDate
// ---------------------------------------------------------------------------

describe("nextInsertDate", () => {
  it("sin ciclo, la próxima inserción es ahora", () => {
    expect(nextInsertDate(null, NOW)).toBe(NOW);
  });

  it("con anillo puesto en pauta cíclica: retirada prevista + 7 días", () => {
    expect(nextInsertDate(inUse, NOW)).toBe("2026-11-17T20:00:00.000Z");
  });

  it("con anillo puesto en pauta continua: la retirada prevista, sin descanso", () => {
    expect(nextInsertDate(continuousInUse, NOW)).toBe("2026-11-10T20:00:00.000Z");
  });

  it("en semana de descanso: retirada real + 7 días", () => {
    expect(nextInsertDate(ringFree, NOW)).toBe("2026-11-06T20:00:00.000Z");
  });

  it("si la inserción prevista ya pasó, es ahora", () => {
    const late = "2026-11-08T09:00:00.000Z";
    expect(nextInsertDate(ringFree, late)).toBe(late);
  });

  it("tras retirar en pauta continua (sin anillo), es ahora", () => {
    const removed = makeCycle({ regimen: "CONTINUOUS", status: "COMPLETED", removedAt: "2026-10-31T10:00:00.000Z" });
    expect(nextInsertDate(removed, NOW)).toBe(NOW);
  });
});

// ---------------------------------------------------------------------------
// stockRunOut / buyBy
// ---------------------------------------------------------------------------

describe("stockRunOut", () => {
  it("sin anillos en casa, coincide con la próxima inserción", () => {
    expect(stockRunOut(inUse, 0, NOW, 28)).toBe("2026-11-17T20:00:00.000Z");
  });

  it("suma 28 días por anillo en pauta cíclica", () => {
    expect(stockRunOut(inUse, 2, NOW, 28)).toBe("2027-01-12T20:00:00.000Z");
  });

  it("suma los días configurados por anillo en pauta continua", () => {
    expect(stockRunOut(continuousInUse, 2, NOW, 35)).toBe("2027-01-19T20:00:00.000Z");
  });
});

describe("buyBy", () => {
  it("sin anillos en casa, es la próxima inserción", () => {
    expect(buyBy(ringFree, 0, NOW, 28)).toBe("2026-11-06T20:00:00.000Z");
  });

  it("con un anillo, es el día en que se inserta ese último anillo", () => {
    expect(buyBy(ringFree, 1, NOW, 28)).toBe("2026-11-06T20:00:00.000Z");
  });

  it("con tres anillos, es la inserción del tercero", () => {
    expect(buyBy(ringFree, 3, NOW, 28)).toBe("2027-01-01T20:00:00.000Z");
  });
});

// ---------------------------------------------------------------------------
// isLowStock
// ---------------------------------------------------------------------------

describe("isLowStock", () => {
  it.each([
    [0, 0, true],
    [1, 0, false],
    [1, 1, true],
    [2, 1, false],
    [2, 2, true],
  ] as const)("count %i con umbral %i → %s", (count, threshold, expected) => {
    expect(isLowStock(count, threshold)).toBe(expected);
  });
});

describe("needsBuyWarning", () => {
  it("no avisa si la reserva nunca se ha guardado, aunque esté a 0", () => {
    expect(needsBuyWarning(0, 1, false)).toBe(false);
  });

  it("avisa si está configurada y en el umbral o por debajo", () => {
    expect(needsBuyWarning(1, 1, true)).toBe(true);
    expect(needsBuyWarning(2, 1, true)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Validación
// ---------------------------------------------------------------------------

describe("validateStockCount", () => {
  it("acepta enteros >= 0", () => {
    expect(isOk(validateStockCount(0))).toBe(true);
    expect(isOk(validateStockCount(12))).toBe(true);
  });

  it.each([-1, 1.5, Number.NaN])("rechaza %p", (value) => {
    expect(isErr(validateStockCount(value))).toBe(true);
  });
});

describe("validateStockThreshold", () => {
  it.each([0, 1, 2])("acepta %i", (value) => {
    expect(isOk(validateStockThreshold(value))).toBe(true);
  });

  it.each([-1, 3, 1.5])("rechaza %p", (value) => {
    expect(isErr(validateStockThreshold(value))).toBe(true);
  });
});

describe("validateBuyReminderHours", () => {
  it("ordena de mayor a menor", () => {
    const result = validateBuyReminderHours([24, 72, 48]);
    if (!isOk(result)) throw new Error("expected Ok");
    expect(result.value).toEqual([72, 48, 24]);
  });

  it.each([
    [[]],
    [[24, 24]],
    [[12]],
    [[24, 96]],
  ])("rechaza %j", (hours) => {
    const result = validateBuyReminderHours(hours);
    if (!isErr(result)) throw new Error("expected Err");
    expect(result.error.code).toBe("INVALID_BUY_REMINDER_HOURS");
  });
});
