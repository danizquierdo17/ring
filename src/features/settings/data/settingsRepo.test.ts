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
  created_at: "2026-04-15T10:00:00.000Z",
  updated_at: "2026-04-15T10:00:00.000Z",
};

const defaultSettings: Settings = {
  regimen: "CYCLIC_21_7",
  continuousDays: 28,
  language: "es-ES",
  theme: "light",
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
