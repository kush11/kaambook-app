import { create } from 'zustand';
import { db } from '../db/client';
import { staff } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'expo-crypto';
import dayjs from 'dayjs';
import type { Staff, SalaryType, StaffStatus } from '../types';

interface AddStaffInput {
  name: string;
  phone?: string;
  photoUri?: string;
  salaryType: SalaryType;
  salaryAmount: number;
  overtimeRate?: number;
  weekOff: number;
  joiningDate?: string;
}

interface StaffState {
  staffList: Staff[];
  isLoading: boolean;
  loadStaff: (businessId: string) => Promise<void>;
  addStaff: (businessId: string, input: AddStaffInput) => Promise<string>;
  updateStaff: (id: string, updates: Partial<Staff>) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;
  getStaffById: (id: string) => Staff | undefined;
}

export const useStaffStore = create<StaffState>((set, get) => ({
  staffList: [],
  isLoading: false,

  loadStaff: async (businessId: string) => {
    set({ isLoading: true });
    const rows = await db.select().from(staff)
      .where(eq(staff.businessId, businessId));
    set({ staffList: rows as Staff[], isLoading: false });
  },

  addStaff: async (businessId: string, input: AddStaffInput) => {
    if (!businessId) {
      return '';
    }
    const id = randomUUID();
    await db.insert(staff).values({
      id,
      businessId,
      name: input.name,
      phone: input.phone || null,
      photoUri: input.photoUri || null,
      salaryType: input.salaryType,
      salaryAmount: input.salaryAmount,
      overtimeRate: input.overtimeRate || 0,
      weekOff: input.weekOff,
      joiningDate: input.joiningDate || dayjs().format('YYYY-MM-DD'),
      status: 'active',
      createdAt: dayjs().toISOString(),
    });
    await get().loadStaff(businessId);
    return id;
  },

  updateStaff: async (id: string, updates: Partial<Staff>) => {
    await db.update(staff).set(updates).where(eq(staff.id, id));
    // Reload from the staff's business
    const s = get().staffList.find(s => s.id === id);
    if (s) await get().loadStaff(s.businessId);
  },

  deleteStaff: async (id: string) => {
    const s = get().staffList.find(s => s.id === id);
    await db.delete(staff).where(eq(staff.id, id));
    if (s) await get().loadStaff(s.businessId);
  },

  getStaffById: (id: string) => {
    return get().staffList.find(s => s.id === id);
  },
}));
