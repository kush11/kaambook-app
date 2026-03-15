import { create } from 'zustand';
import { db } from '../db/client';
import { businesses } from '../db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'expo-crypto';
import dayjs from 'dayjs';
import type { Business } from '../types';

interface BusinessState {
  businesses: Business[];
  activeBusiness: Business | null;
  loadBusinesses: () => Promise<void>;
  addBusiness: (name: string, type?: string) => Promise<string>;
  setActiveBusiness: (id: string) => Promise<void>;
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
}));
