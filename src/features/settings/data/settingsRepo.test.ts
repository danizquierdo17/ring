/**
 * @jest-environment node
 */

import { isOk, isErr } from "../../../shared/result";
import type { SQLiteDatabase } from "expo-sqlite";
import type { SettingsRow } from "../../../infra/db/schema";
import {
  getSettings,
  updateRegimen,
  updateContinuousDays,
  updateStockSettings,
  consumeStockRing,
  type Settings,
} from "./settingsRepo";

// ---------------------------------------------------------------------------
// Mock SQLiteDatabase
// ---------------------------------------------------------------------------

function createMockDb(overrides?: Partial<Record<keyof SQLiteDatabase, unknown>>) {
  return {
    execSync: jest.fn(),
    runSync: jest.fn().mockReturnValue({ changes: 1, lastInsertRowId: 0 }),
    getFirstSync: jest.fn().mockReturnValue(defaultRow),
    getAllSync: jest.fn().mockReturnValue([]),
    withTransactionSync: jest.fn().mockImplementation((cb: () => void) => cb()),
    ...overrides,
  } as unknown as SQLiteDatabase;
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const defaultRow: SettingsRow = {
  id: 1,
  regimen: "CYCLIC_21_7",
  continuous_days: 28,
  language: "es-ES",
  theme: "light",
  ring_stock_count: 0,
  ring_stock_threshold: 1,
  buy_reminder_hours: "[24]",
  ring_stock_configured_at: null,
  created_at: "2026-04-15T10:00:00.000Z",
  updated_at: "2026-04-15T10:00:00.000Z",
};

const defaultSettings: Settings = {
  regimen: "CYCLIC_21_7",
  continuousDays: 28,
  language: "es-ES",
  theme: "light",
  stockCount: 0,
  stockThreshold: 1,
  buyReminderHours: [24],
  stockConfiguredAt: null,
};

// ---------------------------------------------------------------------------
// getSettings
// ---------------------------------------------------------------------------

describe("getSettings", () => {
  it("devuelve Ok(Settings) con los valores de la BD", () => {
    const db = createMockDb({
      getFirstSync: jest.fn().mockReturnValue(defaultRow),
    });

    const result = getSettings(db);

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.regimen).toBe("CYCLIC_21_7");
    expect(result.value.continuousDays).toBe(28);
  });

  it("mapea snake_case de BD a camelCase de dominio", () => {
    const db = createMockDb({
      getFirstSync: jest.fn().mockReturnValue({
        ...defaultRow,
        continuous_days: 35,
      }),
    });

    const result = getSettings(db);

    if (!isOk(result)) return;
    expect(result.value.continuousDays).toBe(35);
  });

  it("devuelve Err(DB_ERROR) cuando SQLite falla", () => {
    const db = createMockDb({
      getFirstSync: jest.fn().mockImplementation(() => {
        throw new Error("disk I/O error");
      }),
    });

    const result = getSettings(db);

    expect(isErr(result)).toBe(true);
    if (!isErr(result)) return;
    expect(result.error.code).toBe("DB_ERROR");
  });

  it("devuelve valores por defecto si la fila no existe (nunca debería ocurrir)", () => {
    const db = createMockDb({
      getFirstSync: jest.fn().mockReturnValue(null),
    });

    const result = getSettings(db);

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    // Si no hay fila, devolvemos defaults; el schema INSERT OR IGNORE garantiza que haya fila
    expect(result.value.regimen).toBe("CYCLIC_21_7");
  });
});

// ---------------------------------------------------------------------------
// updateRegimen
// ---------------------------------------------------------------------------

describe("updateRegimen", () => {
  it("actualiza el régimen a CONTINUOUS", () => {
    const db = createMockDb();

    const result = updateRegimen(db, "CONTINUOUS");

    expect(isOk(result)).toBe(true);
    expect((db.runSync as jest.Mock).mock.calls[0][0]).toContain("UPDATE Settings");
    expect((db.runSync as jest.Mock).mock.calls[0][0]).toContain("regimen");
  });

  it("devuelve Ok(Settings) con el nuevo régimen", () => {
    const db = createMockDb({
      runSync: jest.fn().mockReturnValue({ changes: 1, lastInsertRowId: 0 }),
      getFirstSync: jest.fn().mockReturnValue({
        ...defaultRow,
        regimen: "CONTINUOUS",
      }),
    });

    const result = updateRegimen(db, "CONTINUOUS");

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.regimen).toBe("CONTINUOUS");
  });

  it("devuelve Err(INVALID_REGIMEN) para un régimen inválido", () => {
    const db = createMockDb();

    const result = updateRegimen(db, "INVALID_REGIMEN" as any);

    expect(isErr(result)).toBe(true);
    if (!isErr(result)) return;
    expect(result.error.code).toBe("INVALID_REGIMEN");
  });

  it("devuelve Err(DB_ERROR) cuando la actualización falla", () => {
    const db = createMockDb({
      runSync: jest.fn().mockImplementation(() => {
        throw new Error("database locked");
      }),
    });

    const result = updateRegimen(db, "CYCLIC_21_7");

    expect(isErr(result)).toBe(true);
    if (!isErr(result)) return;
    expect(result.error.code).toBe("DB_ERROR");
  });
});

// ---------------------------------------------------------------------------
// updateContinuousDays
// ---------------------------------------------------------------------------

describe("updateContinuousDays", () => {
  it("actualiza los días de régimen continuo", () => {
    const db = createMockDb();

    const result = updateContinuousDays(db, 35);

    expect(isOk(result)).toBe(true);
    expect((db.runSync as jest.Mock).mock.calls[0][0]).toContain("UPDATE Settings");
    expect((db.runSync as jest.Mock).mock.calls[0][0]).toContain("continuous_days");
  });

  it("devuelve Ok(Settings) con los nuevos días", () => {
    const db = createMockDb({
      runSync: jest.fn().mockReturnValue({ changes: 1, lastInsertRowId: 0 }),
      getFirstSync: jest.fn().mockReturnValue({
        ...defaultRow,
        continuous_days: 35,
      }),
    });

    const result = updateContinuousDays(db, 35);

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.continuousDays).toBe(35);
  });

  it("rechaza valores menores a 21 días", () => {
    const db = createMockDb();

    const result = updateContinuousDays(db, 20);

    expect(isErr(result)).toBe(true);
    if (!isErr(result)) return;
    expect(result.error.code).toBe("INVALID_CONTINUOUS_DAYS");
  });

  it("rechaza valores mayores a 365 días", () => {
    const db = createMockDb();

    const result = updateContinuousDays(db, 366);

    expect(isErr(result)).toBe(true);
    if (!isErr(result)) return;
    expect(result.error.code).toBe("INVALID_CONTINUOUS_DAYS");
  });

  it("devuelve Err(DB_ERROR) en errores de SQLite", () => {
    const db = createMockDb({
      runSync: jest.fn().mockImplementation(() => {
        throw new Error("disk full");
      }),
    });

    const result = updateContinuousDays(db, 30);

    expect(isErr(result)).toBe(true);
    if (!isErr(result)) return;
    expect(result.error.code).toBe("DB_ERROR");
  });
});

// ---------------------------------------------------------------------------
// Reserva de anillos
// ---------------------------------------------------------------------------

describe("getSettings — reserva de anillos", () => {
  it("mapea las columnas de reserva a camelCase", () => {
    const db = createMockDb({
      getFirstSync: jest.fn().mockReturnValue({
        ...defaultRow,
        ring_stock_count: 3,
        ring_stock_threshold: 2,
        buy_reminder_hours: "[72,24]",
        ring_stock_configured_at: "2026-10-20T09:00:00.000Z",
      }),
    });

    const result = getSettings(db);

    if (!isOk(result)) throw new Error("expected Ok");
    expect(result.value).toEqual({
      ...defaultSettings,
      stockCount: 3,
      stockThreshold: 2,
      buyReminderHours: [72, 24],
      stockConfiguredAt: "2026-10-20T09:00:00.000Z",
    });
  });

  it("usa los valores por defecto si las columnas tienen datos corruptos", () => {
    const db = createMockDb({
      getFirstSync: jest.fn().mockReturnValue({
        ...defaultRow,
        ring_stock_count: -4,
        ring_stock_threshold: 7,
        buy_reminder_hours: "no es json",
      }),
    });

    const result = getSettings(db);

    if (!isOk(result)) throw new Error("expected Ok");
    expect(result.value.stockCount).toBe(0);
    expect(result.value.stockThreshold).toBe(1);
    expect(result.value.buyReminderHours).toEqual([24]);
  });
});

describe("updateStockSettings", () => {
  it("guarda reserva, umbral y horas ordenadas de mayor a menor", () => {
    const db = createMockDb();

    const result = updateStockSettings(db, { count: 2, threshold: 0, buyReminderHours: [24, 72] });

    expect(isOk(result)).toBe(true);
    const call = (db.runSync as jest.Mock).mock.calls[0];
    expect(call[0]).toContain("ring_stock_count");
    expect(call.slice(1, 4)).toEqual([2, 0, "[72,24]"]);
  });

  it("marca la reserva como configurada solo la primera vez que se guarda", () => {
    const db = createMockDb();

    updateStockSettings(db, { count: 2 });

    const sql = (db.runSync as jest.Mock).mock.calls[0][0] as string;
    expect(sql).toContain("ring_stock_configured_at = COALESCE(ring_stock_configured_at, ?)");
  });

  it("conserva los campos que no vienen en el parche", () => {
    const db = createMockDb({
      getFirstSync: jest.fn().mockReturnValue({
        ...defaultRow,
        ring_stock_count: 5,
        ring_stock_threshold: 2,
        buy_reminder_hours: "[48]",
      }),
    });

    updateStockSettings(db, { count: 4 });

    const call = (db.runSync as jest.Mock).mock.calls[0];
    expect(call.slice(1, 4)).toEqual([4, 2, "[48]"]);
  });

  it.each([
    [{ count: -1 }, "INVALID_STOCK_COUNT"],
    [{ count: 1.5 }, "INVALID_STOCK_COUNT"],
    [{ threshold: 3 }, "INVALID_STOCK_THRESHOLD"],
    [{ buyReminderHours: [] }, "INVALID_BUY_REMINDER_HOURS"],
    [{ buyReminderHours: [12] }, "INVALID_BUY_REMINDER_HOURS"],
    [{ buyReminderHours: [24, 24] }, "INVALID_BUY_REMINDER_HOURS"],
  ])("rechaza %j con %s sin escribir", (patch, code) => {
    const db = createMockDb();

    const result = updateStockSettings(db, patch);

    if (!isErr(result)) throw new Error("expected Err");
    expect(result.error.code).toBe(code);
    expect(db.runSync).not.toHaveBeenCalled();
  });

  it("devuelve Err(DB_ERROR) cuando SQLite falla", () => {
    const db = createMockDb({
      runSync: jest.fn().mockImplementation(() => {
        throw new Error("disk full");
      }),
    });

    const result = updateStockSettings(db, { count: 1 });

    if (!isErr(result)) throw new Error("expected Err");
    expect(result.error.code).toBe("DB_ERROR");
  });
});

describe("consumeStockRing", () => {
  it("resta uno sin bajar de cero", () => {
    const db = createMockDb();

    consumeStockRing(db);

    expect((db.runSync as jest.Mock).mock.calls[0][0]).toContain("MAX(0, ring_stock_count - 1)");
  });

  it("propaga el error para que la transacción que la envuelve haga rollback", () => {
    const db = createMockDb({
      runSync: jest.fn().mockImplementation(() => {
        throw new Error("disk full");
      }),
    });

    expect(() => consumeStockRing(db)).toThrow("disk full");
  });
});
