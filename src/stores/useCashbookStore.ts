import { create } from 'zustand';
import { db } from '../db/client';
import { cashbook } from '../db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { randomUUID } from 'expo-crypto';
import dayjs from 'dayjs';
import type { CashbookEntry, CashbookType, CashbookCategory } from '../types';

interface AddEntryInput {
  businessId: string;
  amount: number;
  type: CashbookType;
  category: CashbookCategory;
  description?: string;
  date?: string;
}

interface CashbookState {
  entries: CashbookEntry[];
  isLoading: boolean;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  loadEntries: (businessId: string, year: number, month: number) => Promise<void>;
  addEntry: (input: AddEntryInput) => Promise<void>;
  deleteEntry: (id: string, businessId: string, year: number, month: number) => Promise<void>;
}

export const useCashbookStore = create<CashbookState>((set, get) => ({
  entries: [],
  isLoading: false,
  totalIncome: 0,
  totalExpense: 0,
  balance: 0,

  loadEntries: async (businessId: string, year: number, month: number) => {
    set({ isLoading: true });
    const startDate = dayjs().year(year).month(month).startOf('month').format('YYYY-MM-DD');
    const endDate = dayjs().year(year).month(month).endOf('month').format('YYYY-MM-DD');

    const rows = await db.select().from(cashbook)
      .where(and(
        eq(cashbook.businessId, businessId),
        gte(cashbook.date, startDate),
        lte(cashbook.date, endDate),
      ))
      .orderBy(desc(cashbook.date));

    const entries = rows as CashbookEntry[];
    const totalIncome = entries.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
    const totalExpense = entries.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);

    set({
      entries,
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      isLoading: false,
    });
  },

  addEntry: async (input: AddEntryInput) => {
    try {
      await db.insert(cashbook).values({
        id: randomUUID(),
        businessId: input.businessId,
        amount: input.amount,
        type: input.type,
        category: input.category,
        description: input.description || null,
        date: input.date || dayjs().format('YYYY-MM-DD'),
        createdAt: dayjs().toISOString(),
      });
    } catch (e) {
      console.error('Failed to insert cashbook entry:', e);
      throw e;
    }
    const entryDate = dayjs(input.date || dayjs().format('YYYY-MM-DD'));
    await get().loadEntries(input.businessId, entryDate.year(), entryDate.month());
  },

  deleteEntry: async (id: string, businessId: string, year: number, month: number) => {
    await db.delete(cashbook).where(eq(cashbook.id, id));
    await get().loadEntries(businessId, year, month);
  },
}));
