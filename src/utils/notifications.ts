/**
 * Daily attendance reminders.
 *
 * Instead of one repeating alarm with fixed text, the next REMINDER_DAYS days are
 * scheduled as one-off notifications and rebuilt whenever the app opens, attendance is
 * marked or staff change. That lets each reminder:
 *  - name a staff member ("Did Ramesh come to work today?"),
 *  - use day-2 copy for brand-new users (most users who leave, leave after day 1),
 *  - skip today once everyone is marked, and skip days that are a week off for everyone.
 * If the app is not opened for REMINDER_DAYS days the reminders run out by themselves,
 * so someone who has stopped using the app is not reminded forever.
 */
import dayjs from 'dayjs';
import { asc, eq } from 'drizzle-orm';
import i18n from '../i18n';
import { db } from '../db/client';
import { attendance, businesses, staff } from '../db/schema';
import { track, setUserProperties } from './analytics';

const REMINDER_DAYS = 7;
export const REMINDER_TYPE = 'attendance_reminder';

export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const Notifications = await import('expo-notifications');
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/** Weekdays (0 = Sunday) a staff member does not work. */
function weekOffSet(s: { weekOffDays: string | null; weekOff: number }): Set<number> {
  if (s.weekOffDays) {
    return new Set(s.weekOffDays.split(',').filter(Boolean).map(Number));
  }
  return s.weekOff >= 0 ? new Set([s.weekOff]) : new Set();
}

function reminderContent(names: string[], dayIndex: number): { title: string; body: string } {
  if (names.length === 0) {
    return { title: i18n.t('settings.reminder_notif_title'), body: i18n.t('settings.reminder_notif_body') };
  }
  const name = names[0];
  const title = names.length === 1
    ? i18n.t('reminder.title_one', { name })
    : i18n.t('reminder.title_many', { name, count: names.length - 1 });
  // dayIndex 1 = the day after the user started.
  const body = dayIndex === 1 ? i18n.t('reminder.body_day2') : i18n.t('reminder.body');
  return { title, body };
}

/**
 * Rebuilds the scheduled reminders at hour:minute. Safe to call often; it replaces
 * everything it scheduled before.
 */
// Calls are chained so two quick rebuilds (e.g. "mark all" then a screen refresh) never
// interleave their cancel and schedule steps and leave duplicates.
let pending: Promise<void> = Promise.resolve();

export function scheduleAttendanceReminder(hour: number, minute: number): Promise<void> {
  pending = pending.then(() => rebuildReminders(hour, minute));
  return pending;
}

async function rebuildReminders(hour: number, minute: number): Promise<void> {
  try {
    const Notifications = await import('expo-notifications');
    await cancelAttendanceReminder();

    const active = await db
      .select({ id: staff.id, name: staff.name, weekOff: staff.weekOff, weekOffDays: staff.weekOffDays })
      .from(staff)
      .where(eq(staff.status, 'active'))
      .orderBy(asc(staff.createdAt));
    const [first] = await db.select({ createdAt: businesses.createdAt }).from(businesses)
      .orderBy(asc(businesses.createdAt)).limit(1);
    const startDay = dayjs(first?.createdAt ?? undefined).startOf('day');

    const todayStr = dayjs().format('YYYY-MM-DD');
    const markedToday = new Set(
      (await db.select({ staffId: attendance.staffId }).from(attendance).where(eq(attendance.date, todayStr)))
        .map((r) => r.staffId),
    );

    for (let i = 0; i < REMINDER_DAYS; i++) {
      const at = dayjs().add(i, 'day').hour(hour).minute(minute).second(0).millisecond(0);
      if (!at.isAfter(dayjs())) continue;
      // Staff who are expected that day: not on week off, and (today only) not yet marked.
      const due = active.filter((s) => !weekOffSet(s).has(at.day()) && !(i === 0 && markedToday.has(s.id)));
      if (active.length > 0 && due.length === 0) continue;
      const dayIndex = at.startOf('day').diff(startDay, 'day');
      const { title, body } = reminderContent(due.map((s) => s.name), dayIndex);
      await Notifications.scheduleNotificationAsync({
        content: { title, body, data: { type: REMINDER_TYPE, day: dayIndex } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at.toDate() },
      });
    }
  } catch {
    // Notifications not available (e.g. Expo Go)
  }
}

export async function cancelAttendanceReminder(): Promise<void> {
  try {
    const Notifications = await import('expo-notifications');
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // Notifications not available
  }
}

/**
 * Called once at app start: shows notifications while the app is open, records taps on
 * reminders, and records whether notifications are allowed (Android can block them for an
 * app, and some phones' battery savers do), so reminder reach can be measured in PostHog.
 */
export async function initNotifications(): Promise<void> {
  try {
    const Notifications = await import('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    const seen = new Set<string>();
    const report = (response: { notification: { request: { identifier: string; content: { data?: Record<string, unknown> } } } } | null) => {
      if (!response) return;
      const { identifier, content } = response.notification.request;
      if (seen.has(identifier)) return;
      seen.add(identifier);
      const data = content.data ?? {};
      track('notification_opened', { type: String(data.type ?? 'unknown'), day: typeof data.day === 'number' ? data.day : null });
    };
    Notifications.addNotificationResponseReceivedListener(report);
    // App was started by tapping a notification.
    report(await Notifications.getLastNotificationResponseAsync());
    await Notifications.clearLastNotificationResponseAsync?.();

    const { status } = await Notifications.getPermissionsAsync();
    setUserProperties({ notif_permission: status });
  } catch {
    // Notifications not available
  }
}
