/**
 * Monthly register: one landscape PDF with every staff member's day-by-day attendance
 * (the muster roll) and the month's salary register, for owners who keep a paper register.
 * English, like the salary slips, so it reads the same for an accountant.
 */
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import dayjs from 'dayjs';
import { and, gte, lte, inArray } from 'drizzle-orm';
import { db } from '../db/client';
import { attendance, payments } from '../db/schema';
import { calculateSalary } from './salary';
import { buildRegisterHtml, type RegisterRow } from './registerHtml';
import { track } from './analytics';
import { maybeAskForReview } from './reviewPrompt';
import type { Attendance, Payment, Staff } from '../types';

/**
 * Builds and shares the register for the given staff (the caller decides who is included,
 * e.g. active staff plus anyone who left with money still owed).
 */
export async function shareMonthlyRegister(businessName: string, staffList: Staff[], year: number, month: number): Promise<void> {
  const start = dayjs().year(year).month(month).startOf('month').format('YYYY-MM-DD');
  const end = dayjs().year(year).month(month).endOf('month').format('YYYY-MM-DD');
  const ids = staffList.map((s) => s.id);
  const att = ids.length
    ? (await db.select().from(attendance).where(and(inArray(attendance.staffId, ids), gte(attendance.date, start), lte(attendance.date, end)))) as Attendance[]
    : [];
  const pay = ids.length
    ? (await db.select().from(payments).where(and(inArray(payments.staffId, ids), gte(payments.date, start), lte(payments.date, end)))) as Payment[]
    : [];

  const rows: RegisterRow[] = staffList.map((s) => {
    const mine = att.filter((a) => a.staffId === s.id);
    return {
      staff: s,
      records: new Map(mine.map((a) => [a.date, a])),
      breakdown: calculateSalary(s, mine, pay.filter((p) => p.staffId === s.id), year, month),
    };
  });

  const { uri } = await Print.printToFileAsync({ html: buildRegisterHtml(businessName, rows, year, month) });
  let shareUri = uri;
  try {
    const safe = businessName.trim().replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '-') || 'Business';
    const target = new File(Paths.cache, `Register-${safe}-${dayjs().year(year).month(month).locale('en').format('MMM-YYYY')}.pdf`);
    if (target.exists) target.delete();
    const printed = new File(uri);
    printed.move(target);
    shareUri = printed.uri;
  } catch {
    // keep the generated name rather than fail the share
  }
  track('register_shared', { staff_count: staffList.length });
  await Sharing.shareAsync(shareUri, { mimeType: 'application/pdf', dialogTitle: `Register ${businessName}`, UTI: 'com.adobe.pdf' });
  maybeAskForReview('report_shared');
}
