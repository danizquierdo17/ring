import { useEffect } from "react";
import { useSQLiteContext } from "expo-sqlite";
import type { SQLiteDatabase } from "expo-sqlite";

import { getActiveCycle } from "../../cycle/data/cyclesRepo";
import { planNotifications } from "../domain/notificationPlanner";
import { scheduleAll, cancelByIds, getScheduledIds } from "../infra/scheduler";

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function getUtcOffsetMinutes(): number {
  return -new Date().getTimezoneOffset();
}

// ---------------------------------------------------------------------------
// reconcileNotifications — public, can be called from anywhere
//
// Compares expected (from active cycle + planner) vs actual (from expo-notifications).
// Cancels stale ones and schedules missing ones.
// Permission is requested JIT inside scheduleAll — never on app boot.
// Errors (PERMISSION_DENIED) are swallowed; banner is a future feature.
// ---------------------------------------------------------------------------

export async function reconcileNotifications(db: SQLiteDatabase): Promise<void> {
  const cycleResult = getActiveCycle(db);
  if (!cycleResult.ok) return;

  const cycle = cycleResult.value;
  const utcOffset = getUtcOffsetMinutes();

  const expected = cycle !== null
    ? planNotifications(cycle, utcOffset)
    : [];

  const expectedIds = new Set(expected.map((n) => n.id));

  // Find and cancel stale notifications (scheduled but no longer expected)
  const scheduledIds = await getScheduledIds();
  const staleIds = scheduledIds.filter(
    (id) => id.startsWith("removal-") || id.startsWith("insertion-")
  ).filter((id) => !expectedIds.has(id));

  if (staleIds.length > 0) {
    await cancelByIds(staleIds);
  }

  // Schedule the expected notifications (scheduleAll skips past triggers,
  // cancels+reschedules each ID to keep them idempotent)
  if (expected.length > 0) {
    await scheduleAll(expected);
    // PERMISSION_DENIED is swallowed — UI banner handled in a future feature
  }
}

// ---------------------------------------------------------------------------
// useNotificationsReconciliation
//
// Hook called once on app mount (from App.tsx) to reconcile on startup.
// ---------------------------------------------------------------------------

export function useNotificationsReconciliation(): void {
  const db = useSQLiteContext();

  useEffect(() => {
    void reconcileNotifications(db);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
