/**
 * @jest-environment node
 */

// ---------------------------------------------------------------------------
// Mocks — deben declararse antes de cualquier import que los use
// ---------------------------------------------------------------------------

jest.mock("expo-crypto", () => ({
  randomUUID: jest
    .fn()
    .mockReturnValueOnce("aaaaaaaa-0000-4000-a000-000000000001") // cycle id
    .mockReturnValueOnce("bbbbbbbb-0000-4000-a000-000000000001"), // event id
}));

import { isOk, isErr } from "../../../shared/result";
import type { SQLiteDatabase } from "expo-sqlite";
import type { CycleRow } from "../../../infra/db/schema";
import {
  getActiveCycle,
  insertCycle,
  updateCycle,
  type InsertCycleInput,
} from "./cyclesRepo";

// ---------------------------------------------------------------------------
// Mock SQLiteDatabase factory
// ---------------------------------------------------------------------------

function createMockDb(overrides?: Partial<Record<keyof SQLiteDatabase, unknown>>) {
  return {
    execSync: jest.fn(),
    runSync: jest.fn().mockReturnValue({ changes: 1, lastInsertRowId: 0 }),
    getFirstSync: jest.fn().mockReturnValue(null),
    getAllSync: jest.fn().mockReturnValue([]),
    withTransactionSync: jest.fn().mockImplementation((cb: () => void) => cb()),
    ...overrides,
  } as unknown as SQLiteDatabase;
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const INSERTED_AT = "2026-04-15T10:00:00.000Z";
const PLANNED_AT = "2026-05-06T10:00:00.000Z";

const activeCycleRow: CycleRow = {
  id: "aaaaaaaa-0000-4000-a000-000000000001",
  regimen: "CYCLIC_21_7",
  inserted_at: INSERTED_AT,
  removed_at: null,
  planned_removal_at: PLANNED_AT,
  status: "ACTIVE",
  notes: null,
  created_at: INSERTED_AT,
  updated_at: INSERTED_AT,
};

const insertInput: InsertCycleInput = {
  regimen: "CYCLIC_21_7",
  insertedAt: INSERTED_AT,
  plannedRemovalAt: PLANNED_AT,
  notes: null,
};

// ---------------------------------------------------------------------------
// getActiveCycle
// ---------------------------------------------------------------------------

describe("getActiveCycle", () => {
  it("returns Ok(null) when no ACTIVE cycle exists", () => {
    const db = createMockDb();
    const result = getActiveCycle(db);

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value).toBeNull();
  });

  it("returns Ok(Cycle) and maps all fields correctly", () => {
    const db = createMockDb({
      getFirstSync: jest.fn().mockReturnValue(activeCycleRow),
    });

    const result = getActiveCycle(db);

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    const cycle = result.value;
    expect(cycle).not.toBeNull();
    expect(cycle!.id).toBe(activeCycleRow.id);
    expect(cycle!.regimen).toBe("CYCLIC_21_7");
    expect(cycle!.insertedAt).toBe(INSERTED_AT);
    expect(cycle!.removedAt).toBeNull();
    expect(cycle!.status).toBe("ACTIVE");
  });

  it("returns Err(DB_ERROR) when SQLite throws", () => {
    const db = createMockDb({
      getFirstSync: jest.fn().mockImplementation(() => {
        throw new Error("disk I/O error");
      }),
    });

    const result = getActiveCycle(db);

    expect(isErr(result)).toBe(true);
    if (!isErr(result)) return;
    expect(result.error.code).toBe("DB_ERROR");
  });
});

// ---------------------------------------------------------------------------
// insertCycle
// ---------------------------------------------------------------------------

describe("insertCycle", () => {
  beforeEach(() => {
    // Reponer los UUID mock consumidos en cada test
    const Crypto = jest.requireMock("expo-crypto") as { randomUUID: jest.Mock };
    Crypto.randomUUID
      .mockReset()
      .mockReturnValueOnce("aaaaaaaa-0000-4000-a000-000000000001")
      .mockReturnValueOnce("bbbbbbbb-0000-4000-a000-000000000001");
  });

  it("persiste el ciclo y el evento RING_INSERTED en la misma transacción", () => {
    const db = createMockDb();

    const result = insertCycle(db, insertInput);

    expect(isOk(result)).toBe(true);
    // withTransactionSync envuelve ambas inserciones
    expect(db.withTransactionSync).toHaveBeenCalledTimes(1);
    // runSync llamado dos veces: INSERT Cycles + INSERT Events
    expect(db.runSync).toHaveBeenCalledTimes(2);

    const firstCall = (db.runSync as jest.Mock).mock.calls[0] as unknown[];
    expect(typeof firstCall[0]).toBe("string");
    expect((firstCall[0] as string).toUpperCase()).toContain("INSERT INTO CYCLES");

    const secondCall = (db.runSync as jest.Mock).mock.calls[1] as unknown[];
    const secondSql = (secondCall[0] as string).toUpperCase();
    expect(secondSql).toContain("INSERT INTO EVENTS");
    expect(secondSql).toContain("RING_INSERTED");
  });

  it("devuelve Ok(Cycle) con el id generado por expo-crypto", () => {
    const db = createMockDb();

    const result = insertCycle(db, insertInput);

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.id).toBe("aaaaaaaa-0000-4000-a000-000000000001");
    expect(result.value.status).toBe("ACTIVE");
    expect(result.value.regimen).toBe("CYCLIC_21_7");
    expect(result.value.removedAt).toBeNull();
  });

  // -------------------------------------------------------------------------
  // CASO CLAVE — constraint violation mapeado a CYCLE_ALREADY_ACTIVE
  // -------------------------------------------------------------------------
  it("mapea UNIQUE constraint de status=ACTIVE a Err(CYCLE_ALREADY_ACTIVE)", () => {
    const constraintError = Object.assign(
      new Error("UNIQUE constraint failed: Cycles.status"),
      { code: "SQLITE_CONSTRAINT_UNIQUE" }
    );
    const db = createMockDb({
      withTransactionSync: jest.fn().mockImplementation(() => {
        throw constraintError;
      }),
    });

    const result = insertCycle(db, insertInput);

    expect(isErr(result)).toBe(true);
    if (!isErr(result)) return;
    expect(result.error.code).toBe("CYCLE_ALREADY_ACTIVE");
    expect(result.error.message).toMatch(/active/i);
  });

  it("mapea un error de SQLite genérico a Err(DB_ERROR)", () => {
    const db = createMockDb({
      withTransactionSync: jest.fn().mockImplementation(() => {
        throw new Error("database is locked");
      }),
    });

    const result = insertCycle(db, insertInput);

    expect(isErr(result)).toBe(true);
    if (!isErr(result)) return;
    expect(result.error.code).toBe("DB_ERROR");
  });
});

// ---------------------------------------------------------------------------
// updateCycle
// ---------------------------------------------------------------------------

describe("updateCycle", () => {
  const completedCycle = {
    id: "aaaaaaaa-0000-4000-a000-000000000001",
    regimen: "CYCLIC_21_7" as const,
    insertedAt: INSERTED_AT,
    removedAt: "2026-05-06T10:00:00.000Z",
    plannedRemovalAt: PLANNED_AT,
    status: "COMPLETED" as const,
    notes: null,
    createdAt: INSERTED_AT,
    updatedAt: "2026-05-06T10:00:00.000Z",
  };

  it("devuelve Ok(cycle) cuando la actualización afecta 1 fila", () => {
    const db = createMockDb({
      runSync: jest.fn().mockReturnValue({ changes: 1, lastInsertRowId: 0 }),
    });

    const result = updateCycle(db, completedCycle);

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.status).toBe("COMPLETED");
    expect(result.value.removedAt).toBe("2026-05-06T10:00:00.000Z");
  });

  it("devuelve Err(CYCLE_NOT_FOUND) cuando changes === 0", () => {
    const db = createMockDb({
      runSync: jest.fn().mockReturnValue({ changes: 0, lastInsertRowId: 0 }),
    });

    const result = updateCycle(db, completedCycle);

    expect(isErr(result)).toBe(true);
    if (!isErr(result)) return;
    expect(result.error.code).toBe("CYCLE_NOT_FOUND");
  });

  it("devuelve Err(DB_ERROR) cuando SQLite lanza una excepción", () => {
    const db = createMockDb({
      runSync: jest.fn().mockImplementation(() => {
        throw new Error("disk full");
      }),
    });

    const result = updateCycle(db, completedCycle);

    expect(isErr(result)).toBe(true);
    if (!isErr(result)) return;
    expect(result.error.code).toBe("DB_ERROR");
  });
});
