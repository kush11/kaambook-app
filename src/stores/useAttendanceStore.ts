import { create } from 'zustand';
import { db } from '../db/client';
import { attendance } from '../db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { randomUUID } from 'expo-crypto';
import dayjs from 'dayjs';
import type { Attendance, AttendanceStatus } from '../types';

interface AttendanceState {
  records: Attendance[];
  isLoading: boolean;
  loadMonthAttendance: (staffId: string, year: number, month: number) => Promise<void>;
  markAttendance: (staffId: string, date: string, status: AttendanceStatus, note?: string, overtimeHours?: number) => Promise<void>;
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
    const existing = get().records.find(r => r.staffId === staffId && r.date === date);
    const now = dayjs().toISOString();

    if (existing) {
      await db.update(attendance)
        .set({ status, note: note || null, overtimeHours: overtimeHours || 0 })
        .where(eq(attendance.id, existing.id));
    } else {
      await db.insert(attendance).values({
        id: randomUUID(),
        staffId,
        date,
        status,
        note: note || null,
        overtimeHours: overtimeHours || 0,
        createdAt: now,
      });
    }

    // Reload current month
    const d = dayjs(date);
    await get().loadMonthAttendance(staffId, d.year(), d.month());
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
