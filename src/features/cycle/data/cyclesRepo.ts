import * as Crypto from "expo-crypto";
import type { SQLiteDatabase } from "expo-sqlite";

import { ok, err, type Result } from "../../../shared/result";
import type { AppError } from "../../../shared/errors";
import type { CycleRow } from "../../../infra/db/schema";
import type { Cycle, CycleStatus, Regimen } from "../domain/cycleStateMachine";
import { CYCLIC_RING_DAYS, CONTINUOUS_DEFAULT_DAYS } from "../domain/cycleStateMachine";
import type { EditableEventField } from "../../calendar/domain/buildMarkedDates";

// ---------------------------------------------------------------------------
// Public input type
// ---------------------------------------------------------------------------

export type InsertCycleInput = {
  readonly regimen: Regimen;
  readonly insertedAt: string;
  readonly plannedRemovalAt: string;
  readonly notes?: string | null;
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function rowToCycle(row: CycleRow): Cycle {
  return {
    id: row.id,
    regimen: row.regimen as Regimen,
    insertedAt: row.inserted_at,
    removedAt: row.removed_at,
    plannedRemovalAt: row.planned_removal_at,
    status: row.status as CycleStatus,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function isUniqueConstraintError(e: unknown): boolean {
  return (
    e instanceof Error && e.message.includes("UNIQUE constraint failed")
  );
}

function dbError(e: unknown): AppError {
  return {
    code: "DB_ERROR",
    message: e instanceof Error ? e.message : String(e),
  };
}

// ---------------------------------------------------------------------------
// getAllCycles
// ---------------------------------------------------------------------------

export function getAllCycles(
  db: SQLiteDatabase
): Result<Cycle[], AppError> {
  try {
    const rows = db.getAllSync<CycleRow>(
      "SELECT * FROM Cycles ORDER BY inserted_at DESC"
    );
    return ok(rows.map(rowToCycle));
  } catch (e) {
    return err(dbError(e));
  }
}

// ---------------------------------------------------------------------------
// getActiveCycle
// ---------------------------------------------------------------------------

export function getActiveCycle(
  db: SQLiteDatabase
): Result<Cycle | null, AppError> {
  try {
    const row = db.getFirstSync<CycleRow>(
      "SELECT * FROM Cycles WHERE status = 'ACTIVE' LIMIT 1"
    );
    return ok(row !== null ? rowToCycle(row) : null);
  } catch (e) {
    return err(dbError(e));
  }
}

// ---------------------------------------------------------------------------
// getCurrentCycle
// Returns the ACTIVE cycle if one exists, otherwise the most recent COMPLETED
// cycle so that deriveUiState can detect the RING_FREE window.
// ---------------------------------------------------------------------------

export function getCurrentCycle(
  db: SQLiteDatabase
): Result<Cycle | null, AppError> {
  try {
    // Active first
    const active = db.getFirstSync<CycleRow>(
      "SELECT * FROM Cycles WHERE status = 'ACTIVE' LIMIT 1"
    );
    if (active !== null) return ok(rowToCycle(active));

    // Fall back to most recent completed cycle (for RING_FREE detection)
    const last = db.getFirstSync<CycleRow>(
      "SELECT * FROM Cycles WHERE status = 'COMPLETED' ORDER BY removed_at DESC LIMIT 1"
    );
    return ok(last !== null ? rowToCycle(last) : null);
  } catch (e) {
    return err(dbError(e));
  }
}

// ---------------------------------------------------------------------------
// insertCycle
// Atómica: crea el registro en Cycles y el evento RING_INSERTED en Events
// dentro de una única transacción. Si falla cualquiera de las dos, se
// revierten ambas.
// ---------------------------------------------------------------------------

export function insertCycle(
  db: SQLiteDatabase,
  input: InsertCycleInput
): Result<Cycle, AppError> {
  const id = Crypto.randomUUID();
  const now = new Date().toISOString();

  try {
    db.withTransactionSync(() => {
      db.runSync(
        `INSERT INTO Cycles
           (id, regimen, inserted_at, planned_removal_at, status, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?, ?)`,
        id,
        input.regimen,
        input.insertedAt,
        input.plannedRemovalAt,
        input.notes ?? null,
        now,
        now
      );

      const eventId = Crypto.randomUUID();
      db.runSync(
        `INSERT INTO Events (id, cycle_id, type, occurred_at, recorded_at)
         VALUES (?, ?, 'RING_INSERTED', ?, ?)`,
        eventId,
        id,
        input.insertedAt,
        now
      );
    });

    const cycle: Cycle = {
      id,
      regimen: input.regimen,
      insertedAt: input.insertedAt,
      removedAt: null,
      plannedRemovalAt: input.plannedRemovalAt,
      status: "ACTIVE",
      notes: input.notes ?? null,
      createdAt: now,
      updatedAt: now,
    };

    return ok(cycle);
  } catch (e) {
    if (isUniqueConstraintError(e)) {
      return err({
        code: "CYCLE_ALREADY_ACTIVE",
        message: "Only one active cycle is allowed. Violación de índice único en Cycles.status.",
      });
    }
    return err(dbError(e));
  }
}

// ---------------------------------------------------------------------------
// updateCycle
// Usado al retirar el anillo (removeRing): actualiza status, removed_at, etc.
// ---------------------------------------------------------------------------

export function updateCycle(
  db: SQLiteDatabase,
  cycle: Cycle
): Result<Cycle, AppError> {
  try {
    const result = db.runSync(
      `UPDATE Cycles
          SET removed_at         = ?,
              planned_removal_at = ?,
              status             = ?,
              notes              = ?,
              updated_at         = ?
        WHERE id = ?`,
      cycle.removedAt,
      cycle.plannedRemovalAt,
      cycle.status,
      cycle.notes,
      cycle.updatedAt,
      cycle.id
    );

    if (result.changes === 0) {
      return err({
        code: "CYCLE_NOT_FOUND",
        message: `Cycle ${cycle.id} not found in database.`,
      });
    }

    return ok(cycle);
  } catch (e) {
    return err(dbError(e));
  }
}

// ---------------------------------------------------------------------------
// updateCycleTimestamp
// Edits inserted_at or removed_at of an existing cycle.
// When inserted_at changes, planned_removal_at is recalculated automatically.
// ---------------------------------------------------------------------------

export function updateCycleTimestamp(
  db: SQLiteDatabase,
  cycleId: string,
  field: EditableEventField,
  newIso: string,
  regimen: Regimen,
  continuousDays?: number,
): Result<Cycle, AppError> {
  try {
    const now = new Date().toISOString();

    if (field === 'inserted_at') {
      const ringDays = regimen === 'CYCLIC_21_7' ? CYCLIC_RING_DAYS : (continuousDays ?? CONTINUOUS_DEFAULT_DAYS);
      const newPlanned = new Date(newIso);
      newPlanned.setUTCDate(newPlanned.getUTCDate() + ringDays);
      const newPlannedIso = newPlanned.toISOString();

      db.runSync(
        `UPDATE Cycles SET inserted_at = ?, planned_removal_at = ?, updated_at = ? WHERE id = ?`,
        newIso, newPlannedIso, now, cycleId,
      );
    } else {
      db.runSync(
        `UPDATE Cycles SET removed_at = ?, updated_at = ? WHERE id = ?`,
        newIso, now, cycleId,
      );
    }

    const row = db.getFirstSync<CycleRow>(`SELECT * FROM Cycles WHERE id = ?`, cycleId);
    if (!row) {
      return err({ code: 'CYCLE_NOT_FOUND', message: `Cycle ${cycleId} not found after update.` });
    }
    return ok(rowToCycle(row));
  } catch (e) {
    return err(dbError(e));
  }
}
