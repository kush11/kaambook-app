import { create } from 'zustand';
import { db } from '../db/client';
import { businesses, staff, attendance, payments, advances, cashbook } from '../db/schema';
import { eq, inArray } from 'drizzle-orm';
import { randomUUID } from 'expo-crypto';
import dayjs from 'dayjs';
import type { Business } from '../types';

interface BusinessState {
  businesses: Business[];
  activeBusiness: Business | null;
  loadBusinesses: () => Promise<void>;
  addBusiness: (name: string, type?: string) => Promise<string>;
  setActiveBusiness: (id: string) => Promise<void>;
  updateBusiness: (id: string, name: string) => Promise<void>;
  deleteBusiness: (id: string) => Promise<string | null>;
}

export const useBusinessStore = create<BusinessState>((set, get) => ({
  businesses: [],
  activeBusiness: null,

  loadBusinesses: async () => {
    const rows = await db.select().from(businesses);
    const active = rows.find(b => b.isActive === 1) || rows[0] || null;
    set({ businesses: rows as Business[], activeBusiness: active as Business | null });
  },

  addBusiness: async (name: string, type = 'general') => {
    const id = randomUUID();
    await db.insert(businesses).values({
      id,
      name,
      type,
      isActive: 1,
      createdAt: dayjs().toISOString(),
    });
    await get().loadBusinesses();
    return id;
  },

  setActiveBusiness: async (id: string) => {
    // Deactivate all
    await db.update(businesses).set({ isActive: 0 });
    // Activate selected
    await db.update(businesses).set({ isActive: 1 }).where(eq(businesses.id, id));
    await get().loadBusinesses();
  },

  updateBusiness: async (id: string, name: string) => {
    await db.update(businesses).set({ name }).where(eq(businesses.id, id));
    await get().loadBusinesses();
  },

  deleteBusiness: async (id: string) => {
    // Cascade: remove this business's staff and all their records, plus its cashbook.
    const staffRows = await db.select({ id: staff.id }).from(staff).where(eq(staff.businessId, id));
    const staffIds = staffRows.map(s => s.id);
    if (staffIds.length > 0) {
      await db.delete(attendance).where(inArray(attendance.staffId, staffIds));
      await db.delete(payments).where(inArray(payments.staffId, staffIds));
      await db.delete(advances).where(inArray(advances.staffId, staffIds));
      await db.delete(staff).where(eq(staff.businessId, id));
    }
    await db.delete(cashbook).where(eq(cashbook.businessId, id));
    await db.delete(businesses).where(eq(businesses.id, id));

    // Ensure one business stays active after deletion.
    const rows = await db.select().from(businesses);
    let activeId: string | null = rows.find(b => b.isActive === 1)?.id ?? null;
    if (!activeId && rows.length > 0) {
      activeId = rows[0].id;
      await db.update(businesses).set({ isActive: 1 }).where(eq(businesses.id, activeId));
    }
    await get().loadBusinesses();
    return activeId;
  },
}));
