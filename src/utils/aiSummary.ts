import { db } from '../db/client';
import { attendance, payments } from '../db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import dayjs from 'dayjs';
import { calculateSalary } from './salary';
import type { Staff, Attendance, Payment } from '../types';

/**
 * URL of your deployed AI proxy (Cloudflare Worker / Vercel).
 * See ai-proxy/README.md to deploy it for free, then paste the URL here.
 * Leave empty to keep the feature disabled.
 */
export const AI_PROXY_URL = 'https://hisab-ai.hisabpagar-kush.workers.dev';

export interface MonthSummaryInput {
  business: string;
  month: string;
  totalWageCost: number;
  totalPaid: number;
  totalDue: number;
  attendancePercent: number;
  staff: {
    name: string;
    present: number;
    absent: number;
    halfDay: number;
    earned: number;
    paid: number;
    due: number;
  }[];
}

/** Builds the compact payload sent to the AI for a given business + month. */
export async function gatherMonthSummary(
  businessName: string,
  staffList: Staff[],
  year: number,
  month: number
): Promise<MonthSummaryInput> {
  const startDate = dayjs().year(year).month(month).startOf('month').format('YYYY-MM-DD');
  const endDate = dayjs().year(year).month(month).endOf('month').format('YYYY-MM-DD');

  const active = staffList.filter((s) => s.status === 'active');
  let totalWage = 0;
  let totalPaid = 0;
  let totalDue = 0;
  let presentSum = 0;
  let workingSum = 0;
  const staff: MonthSummaryInput['staff'] = [];

  for (const s of active) {
    const att = (await db
      .select()
      .from(attendance)
      .where(
        and(eq(attendance.staffId, s.id), gte(attendance.date, startDate), lte(attendance.date, endDate))
      )) as Attendance[];
    const pay = (await db
      .select()
      .from(payments)
      .where(
        and(eq(payments.staffId, s.id), gte(payments.date, startDate), lte(payments.date, endDate))
      )) as Payment[];

    const b = calculateSalary(s, att, pay, year, month);
    totalWage += b.earnedSalary;
    totalPaid += b.totalPaid;
    totalDue += b.balanceDue;
    presentSum += b.presentDays + b.halfDays * 0.5;
    workingSum += b.workingDays;

    staff.push({
      name: s.name,
      present: b.presentDays,
      absent: b.absentDays,
      halfDay: b.halfDays,
      earned: Math.round(b.earnedSalary),
      paid: Math.round(b.totalPaid),
      due: Math.round(b.balanceDue),
    });
  }

  const attendancePercent = workingSum > 0 ? Math.round((presentSum / workingSum) * 100) : 0;

  return {
    business: businessName,
    month: dayjs().year(year).month(month).format('MMMM YYYY'),
    totalWageCost: Math.round(totalWage),
    totalPaid: Math.round(totalPaid),
    totalDue: Math.round(totalDue),
    attendancePercent,
    staff,
  };
}

/** Calls the proxy and returns the generated summary text. */
export async function fetchAiSummary(data: MonthSummaryInput, language: string): Promise<string> {
  if (!AI_PROXY_URL) {
    throw new Error('NOT_CONFIGURED');
  }
  const res = await fetch(AI_PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data, language }),
  });
  if (!res.ok) {
    throw new Error('REQUEST_FAILED');
  }
  const j = (await res.json()) as { summary?: string; error?: string };
  if (j.error || !j.summary) {
    throw new Error('REQUEST_FAILED');
  }
  return j.summary;
}

export function isAiConfigured(): boolean {
  return !!AI_PROXY_URL;
}
