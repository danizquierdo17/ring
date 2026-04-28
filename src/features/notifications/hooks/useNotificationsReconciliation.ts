import { useEffect } from "react";
import { useSQLiteContext } from "expo-sqlite";

import { getActiveCycle } from "../../cycle/data/cyclesRepo";
import { planNotifications } from "../domain/notificationPlanner";
import { scheduleAll, cancelByIds, getScheduledIds } from "../infra/scheduler";

// ---------------------------------------------------------------------------
// useNotificationsReconciliation
//
// Called once on app mount (from App.tsx). Compares:
//   - what notifications SHOULD exist (from the active cycle + planner)
//   - what notifications ARE scheduled (from expo-notifications)
//
// Then cancels stale ones and schedules missing ones.
//
// Permission is requested JIT inside scheduleAll — never on app boot.
// A PERMISSION_DENIED result is swallowed here; a UI banner is a future task.
// ---------------------------------------------------------------------------

function getUtcOffsetMinutes(): number {
  return -new Date().getTimezoneOffset();
}

export function useNotificationsReconciliation(): void {
  const db = useSQLiteContext();

  useEffect(() => {
    void reconcile(db);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

async function reconcile(db: ReturnType<typeof useSQLiteContext>): Promise<void> {
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
