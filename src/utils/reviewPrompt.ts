/**
 * Asks for a Play Store rating through Google's in-app review sheet.
 *
 * Called right after a "happy moment" (salary slip shared, a week of attendance
 * marked). Google decides whether the sheet actually appears and gives no
 * result back, so we only record that we asked — and never ask more than once
 * every REVIEW_GAP_DAYS.
 */
import * as StoreReview from 'expo-store-review';
import dayjs from 'dayjs';
import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { attendance, settings } from '../db/schema';
import { track } from './analytics';

const REVIEW_GAP_DAYS = 90;
const ATTENDANCE_DAYS_BEFORE_ASKING = 7;
const SETTING_KEY = 'review_requested_at';

type ReviewTrigger = 'report_shared' | 'attendance_streak';

async function askedRecently(): Promise<boolean> {
  const rows = await db.select().from(settings).where(eq(settings.key, SETTING_KEY));
  const last = rows[0]?.value;
  return !!last && dayjs().diff(dayjs(last), 'day') < REVIEW_GAP_DAYS;
}

export async function maybeAskForReview(trigger: ReviewTrigger): Promise<void> {
  try {
    if (await askedRecently()) return;
    if (trigger === 'attendance_streak') {
      const days = await db.select({ date: attendance.date }).from(attendance).groupBy(attendance.date);
      if (days.length < ATTENDANCE_DAYS_BEFORE_ASKING) return;
    }
    if (!(await StoreReview.isAvailableAsync())) return;

    const now = dayjs().toISOString();
    await db.insert(settings).values({ key: SETTING_KEY, value: now })
      .onConflictDoUpdate({ target: settings.key, set: { value: now } });
    await StoreReview.requestReview();
    track('review_requested', { trigger });
  } catch {
    // a rating prompt must never break the action that triggered it
  }
}
