import { create } from 'zustand';
import { db } from '../db/client';
import { payments } from '../db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { randomUUID } from 'expo-crypto';
import dayjs from 'dayjs';
import type { Payment, PaymentType, PaymentMode } from '../types';

interface AddPaymentInput {
  staffId: string;
  amount: number;
  type: PaymentType;
  mode: PaymentMode;
  date?: string;
  note?: string;
}

interface PaymentState {
  payments: Payment[];
  isLoading: boolean;
  loadPayments: (staffId: string) => Promise<void>;
  loadMonthPayments: (staffId: string, year: number, month: number) => Promise<Payment[]>;
  addPayment: (input: AddPaymentInput) => Promise<void>;
  deletePayment: (id: string, staffId: string) => Promise<void>;
  getTotalPaid: (staffId: string, year: number, month: number) => Promise<number>;
}

export const usePaymentStore = create<PaymentState>((set, get) => ({
  payments: [],
  isLoading: false,

  loadPayments: async (staffId: string) => {
    set({ isLoading: true });
    const rows = await db.select().from(payments)
      .where(eq(payments.staffId, staffId))
      .orderBy(desc(payments.date));
    set({ payments: rows as Payment[], isLoading: false });
  },

  loadMonthPayments: async (staffId: string, year: number, month: number) => {
    const startDate = dayjs().year(year).month(month).startOf('month').format('YYYY-MM-DD');
    const endDate = dayjs().year(year).month(month).endOf('month').format('YYYY-MM-DD');

    const rows = await db.select().from(payments)
      .where(and(
        eq(payments.staffId, staffId),
        gte(payments.date, startDate),
        lte(payments.date, endDate),
      ))
      .orderBy(desc(payments.date));
    return rows as Payment[];
  },

  addPayment: async (input: AddPaymentInput) => {
    await db.insert(payments).values({
      id: randomUUID(),
      staffId: input.staffId,
      amount: input.amount,
      type: input.type,
      mode: input.mode,
      date: input.date || dayjs().format('YYYY-MM-DD'),
      note: input.note || null,
      createdAt: dayjs().toISOString(),
    });
    await get().loadPayments(input.staffId);
  },

  deletePayment: async (id: string, staffId: string) => {
    await db.delete(payments).where(eq(payments.id, id));
    await get().loadPayments(staffId);
  },

  getTotalPaid: async (staffId: string, year: number, month: number) => {
    const monthPayments = await get().loadMonthPayments(staffId, year, month);
    return monthPayments.reduce((total, p) => {
      if (p.type === 'penalty') return total - p.amount;
      return total + p.amount;
    }, 0);
  },
}));
