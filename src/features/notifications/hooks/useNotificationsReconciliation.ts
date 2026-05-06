import { useEffect } from "react";
import { useSQLiteContext } from "expo-sqlite";
import type { SQLiteDatabase } from "expo-sqlite";

import { getCurrentCycle } from "../../cycle/data/cyclesRepo";
import { planNotifications } from "../domain/notificationPlanner";
import { scheduleAll, cancelByIds, getScheduledIds, initNotificationChannel } from "../infra/scheduler";

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function getUtcOffsetMinutes(): number {
  return -new Date().getTimezoneOffset();
}

// ---------------------------------------------------------------------------
// reconcileNotifications
// ---------------------------------------------------------------------------

export async function reconcileNotifications(db: SQLiteDatabase): Promise<void> {
  const cycleResult = getCurrentCycle(db);
  if (!cycleResult.ok) return;

  const cycle = cycleResult.value;
  const utcOffset = getUtcOffsetMinutes();

  const expected = cycle !== null ? planNotifications(cycle, utcOffset) : [];
  const expectedIds = new Set(expected.map((n) => n.id));

  const scheduledIds = await getScheduledIds();
  const staleIds = scheduledIds
    .filter((id) => id.startsWith("removal-") || id.startsWith("insertion-"))
    .filter((id) => !expectedIds.has(id));

  if (staleIds.length > 0) {
    await cancelByIds(staleIds);
  }

  if (expected.length > 0) {
    await scheduleAll(expected);
  }
}

// ---------------------------------------------------------------------------
// useNotificationsReconciliation
//
// Runs once on app mount. The channel is created here (once) before any
// scheduling happens. No AppState listener — reconciliation at mount covers
// the case where Android cancelled alarms while the app was backgrounded.
// ---------------------------------------------------------------------------

export function useNotificationsReconciliation(): void {
  const db = useSQLiteContext();

  useEffect(() => {
    void initNotificationChannel().then(() => reconcileNotifications(db));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
