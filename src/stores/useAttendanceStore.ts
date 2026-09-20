import { create } from 'zustand';
import { db } from '../db/client';
import { attendance } from '../db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { randomUUID } from 'expo-crypto';
import dayjs from 'dayjs';
import type { Attendance, AttendanceStatus } from '../types';
import { track } from '../utils/analytics';

interface AttendanceState {
  records: Attendance[];
  isLoading: boolean;
  loadMonthAttendance: (staffId: string, year: number, month: number) => Promise<void>;
  markAttendance: (staffId: string, date: string, status: AttendanceStatus, note?: string, overtimeHours?: number) => Promise<void>;
  markAllStatus: (staffIds: string[], date: string, status: AttendanceStatus) => Promise<void>;
  markAllPresent: (staffIds: string[], date: string) => Promise<void>;
  getAttendanceForDate: (staffId: string, date: string) => Attendance | undefined;
  getMonthSummary: (staffId: string, year: number, month: number) => Promise<Record<AttendanceStatus, number>>;
}

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  records: [],
  isLoading: false,

  loadMonthAttendance: async (staffId: string, year: number, month: number) => {
    set({ isLoading: true });
    const startDate = dayjs().year(year).month(month).startOf('month').format('YYYY-MM-DD');
    const endDate = dayjs().year(year).month(month).endOf('month').format('YYYY-MM-DD');

    const rows = await db.select().from(attendance)
      .where(and(
        eq(attendance.staffId, staffId),
        gte(attendance.date, startDate),
        lte(attendance.date, endDate),
      ));
    set({ records: rows as Attendance[], isLoading: false });
  },

  markAttendance: async (staffId: string, date: string, status: AttendanceStatus, note?: string, overtimeHours?: number) => {
    const now = dayjs().toISOString();

    // Atomic upsert: insert, or if a row already exists for this (staff, date)
    // update it instead. Never throws a UNIQUE constraint error.
    await db.insert(attendance)
      .values({
        id: randomUUID(),
        staffId,
        date,
        status,
        note: note || null,
        overtimeHours: overtimeHours || 0,
        createdAt: now,
      })
      .onConflictDoUpdate({
        target: [attendance.staffId, attendance.date],
        set: { status, note: note || null, overtimeHours: overtimeHours || 0 },
      });

    // Reload current month
    const d = dayjs(date);
    await get().loadMonthAttendance(staffId, d.year(), d.month());
    track('attendance_marked', { status, has_overtime: !!overtimeHours, bulk: false });
  },

  // Marks every given staff as "present" for a date in one shot.
  // Queries the DB per staff (instead of relying on in-memory records) so it
  // is safe to call from the home screen / for bulk marking without hitting
  // the UNIQUE(staffId, date) constraint.
  // Sets the same status (e.g. 'present' or 'holiday') for many staff on a date.
  // Queries the DB per staff so it is safe for bulk use (no UNIQUE conflicts).
  markAllStatus: async (staffIds: string[], date: string, status: AttendanceStatus) => {
    const now = dayjs().toISOString();
    for (const staffId of staffIds) {
      // Atomic upsert per staff — safe to re-run, never throws UNIQUE errors.
      await db.insert(attendance)
        .values({ id: randomUUID(), staffId, date, status, note: null, overtimeHours: 0, createdAt: now })
        .onConflictDoUpdate({
          target: [attendance.staffId, attendance.date],
          set: { status },
        });
    }
    track('attendance_marked', { status, bulk: true, staff_count: staffIds.length });
  },

  markAllPresent: async (staffIds: string[], date: string) => {
    await get().markAllStatus(staffIds, date, 'present');
  },

  getAttendanceForDate: (staffId: string, date: string) => {
    return get().records.find(r => r.staffId === staffId && r.date === date);
  },

  getMonthSummary: async (staffId: string, year: number, month: number) => {
    const startDate = dayjs().year(year).month(month).startOf('month').format('YYYY-MM-DD');
    const endDate = dayjs().year(year).month(month).endOf('month').format('YYYY-MM-DD');

    const rows = await db.select().from(attendance)
      .where(and(
        eq(attendance.staffId, staffId),
        gte(attendance.date, startDate),
        lte(attendance.date, endDate),
      ));

    const summary: Record<string, number> = {
      present: 0,
      absent: 0,
      half_day: 0,
      paid_leave: 0,
      unpaid_leave: 0,
      holiday: 0,
      week_off: 0,
    };

    rows.forEach(r => {
      if (summary[r.status] !== undefined) summary[r.status]++;
    });

    return summary as Record<AttendanceStatus, number>;
  },
}));
