import * as Notifications from "expo-notifications";

import { ok, err, type Result } from "../../../shared/result";
import type { AppError } from "../../../shared/errors";
import type { ScheduledNotification } from "../domain/notificationPlanner";

// ---------------------------------------------------------------------------
// Configure how notifications are presented when the app is in foreground
// ---------------------------------------------------------------------------

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowList: true,
  }),
});

// ---------------------------------------------------------------------------
// Permission — JIT, never on boot
// ---------------------------------------------------------------------------

async function requestPermission(): Promise<Result<true, AppError>> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") {
    return err({
      code: "PERMISSION_DENIED",
      message: "El permiso de notificaciones fue denegado.",
    });
  }
  return ok(true);
}

// ---------------------------------------------------------------------------
// scheduleAll
//
// Cancels any existing notifications whose IDs are in the list, then
// schedules the new ones. Filters out triggers already in the past.
// Returns Err(PERMISSION_DENIED) silently if the user denies — the caller
// decides whether to surface a UI banner.
// ---------------------------------------------------------------------------

export async function scheduleAll(
  notifications: ScheduledNotification[]
): Promise<Result<void, AppError>> {
  const permResult = await requestPermission();
  if (!permResult.ok) return permResult;

  const now = Date.now();

  for (const notif of notifications) {
    const triggerMs = new Date(notif.triggerAt).getTime();

    // Skip triggers that have already passed
    if (triggerMs <= now) continue;

    // Cancel any existing instance of this ID to avoid duplicates
    await Notifications.cancelScheduledNotificationAsync(notif.id).catch(() => {
      // Ignore — notification may not exist yet
    });

    await Notifications.scheduleNotificationAsync({
      identifier: notif.id,
      content: {
        title: notif.title,
        body: notif.body,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(notif.triggerAt),
      },
    });
  }

  return ok(undefined);
}

// ---------------------------------------------------------------------------
// cancelAll
//
// Cancels all scheduled notifications for a given array of IDs.
// Used when a cycle is interrupted or manually overridden.
// ---------------------------------------------------------------------------

export async function cancelByIds(ids: string[]): Promise<void> {
  await Promise.all(
    ids.map((id) =>
      Notifications.cancelScheduledNotificationAsync(id).catch(() => {
        // Ignore missing IDs
      })
    )
  );
}

// ---------------------------------------------------------------------------
// getScheduledIds
//
// Returns the identifiers of all currently scheduled notifications.
// Used by the reconciler to diff expected vs actual.
// ---------------------------------------------------------------------------

export async function getScheduledIds(): Promise<string[]> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.map((n) => n.identifier);
}
