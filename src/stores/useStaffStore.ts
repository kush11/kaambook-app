import { create } from 'zustand';
import { db } from '../db/client';
import { staff } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'expo-crypto';
import dayjs from 'dayjs';
import type { Staff, SalaryType, StaffStatus } from '../types';
import { track, setUserProperties } from '../utils/analytics';

interface AddStaffInput {
  name: string;
  phone?: string;
  photoUri?: string;
  salaryType: SalaryType;
  salaryAmount: number;
  overtimeRate?: number;
  weekOffDays: number[];
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
  isPhoneTaken: (phone: string, excludeId?: string) => boolean;
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
      weekOff: input.weekOffDays[0] ?? -1, // keep legacy column in sync
      weekOffDays: input.weekOffDays.join(','),
      joiningDate: input.joiningDate || dayjs().format('YYYY-MM-DD'),
      status: 'active',
      createdAt: dayjs().toISOString(),
    });
    await get().loadStaff(businessId);
    track('staff_added', {
      salary_type: input.salaryType,
      has_phone: !!input.phone,
      has_photo: !!input.photoUri,
    });
    setUserProperties({ staff_count: get().staffList.length });
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

  // True if another staff member in the currently loaded (active) business already
  // uses this phone number. Empty phone is always allowed. `excludeId` skips the
  // staff member being edited so saving their own number doesn't count as a clash.
  isPhoneTaken: (phone: string, excludeId?: string) => {
    const digits = (phone || '').replace(/\D/g, '');
    if (!digits) return false;
    return get().staffList.some(
      (s) => s.id !== excludeId && (s.phone || '').replace(/\D/g, '') === digits
    );
  },
}));
