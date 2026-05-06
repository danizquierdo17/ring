import { Platform } from "react-native";
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
// Android notification channel
//
// Called once at app init (from useNotificationsReconciliation), not on every
// scheduleAll call, to avoid bridge interference with native dialogs.
// ---------------------------------------------------------------------------

const CHANNEL_ID = "ringcare-reminders";

export async function initNotificationChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: "Recordatorios de anillo",
    description: "Avisos de inserción y retirada del anillo anticonceptivo",
    importance: Notifications.AndroidImportance.MAX,
    sound: "default",
    vibrationPattern: [0, 250, 250, 250],
    enableLights: true,
    enableVibrate: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: false,
  });
}

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
// ---------------------------------------------------------------------------

export async function scheduleAll(
  notifications: ScheduledNotification[]
): Promise<Result<void, AppError>> {
  const permResult = await requestPermission();
  if (!permResult.ok) return permResult;

  const now = Date.now();

  for (const notif of notifications) {
    const triggerMs = new Date(notif.triggerAt).getTime();
    if (triggerMs <= now) continue;

    await Notifications.cancelScheduledNotificationAsync(notif.id).catch(() => {});

    await Notifications.scheduleNotificationAsync({
      identifier: notif.id,
      content: {
        title: notif.title,
        body: notif.body,
        sound: "default",
        ...(Platform.OS === "android" && {
          channelId: CHANNEL_ID,
          priority: Notifications.AndroidNotificationPriority.MAX,
          vibrate: [0, 250, 250, 250],
        }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(notif.triggerAt),
        channelId: Platform.OS === "android" ? CHANNEL_ID : undefined,
      },
    });
  }

  return ok(undefined);
}

// ---------------------------------------------------------------------------
// cancelByIds
// ---------------------------------------------------------------------------

export async function cancelByIds(ids: string[]): Promise<void> {
  await Promise.all(
    ids.map((id) =>
      Notifications.cancelScheduledNotificationAsync(id).catch(() => {})
    )
  );
}

// ---------------------------------------------------------------------------
// getScheduledIds
// ---------------------------------------------------------------------------

export async function getScheduledIds(): Promise<string[]> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.map((n) => n.identifier);
}
