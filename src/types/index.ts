export type SalaryType = 'monthly' | 'daily' | 'weekly' | 'hourly';

export type AttendanceStatus = 'present' | 'absent' | 'half_day' | 'paid_leave' | 'unpaid_leave' | 'holiday' | 'week_off';

export type PaymentType = 'salary' | 'advance' | 'bonus' | 'penalty';

export type PaymentMode = 'cash' | 'upi' | 'bank';

export type StaffStatus = 'active' | 'inactive';

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Sun, 6=Sat

export interface Business {
  id: string;
  name: string;
  type: string;
  address: string | null;
  isActive: number; // SQLite boolean
  createdAt: string;
}

export interface Staff {
  id: string;
  businessId: string;
  name: string;
  phone: string | null;
  photoUri: string | null;
  salaryType: SalaryType;
  salaryAmount: number;
  weekOff: number; // legacy single day of week, -1 for none
  weekOffDays: string | null; // comma-separated days e.g. "0,6"
  overtimeRate: number;
  /** Normal hours in a working day (hourly pay, and the default for "present"). */
  shiftHours: number;
  /** ₹ deducted per day marked late; 0 = no fine. */
  lateFine: number;
  upiId: string | null;
  joiningDate: string;
  status: StaffStatus;
  createdAt: string;
}

export interface Attendance {
  id: string;
  staffId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  note: string | null;
  overtimeHours: number;
  /** Hourly staff: hours worked that day; null = the staff member's shift hours. */
  hoursWorked: number | null;
  isLate: number; // SQLite boolean
  createdAt: string;
}

export interface Payment {
  id: string;
  staffId: string;
  amount: number;
  type: PaymentType;
  mode: PaymentMode;
  date: string; // YYYY-MM-DD
  note: string | null;
  createdAt: string;
}

export interface Settings {
  key: string;
  value: string;
}

export type CashbookType = 'income' | 'expense';

export type ExpenseCategory = 'wages' | 'material' | 'transport' | 'food' | 'rent' | 'other';
export type IncomeCategory = 'sales' | 'payment_received' | 'other_income';
export type CashbookCategory = ExpenseCategory | IncomeCategory;

export interface CashbookEntry {
  id: string;
  businessId: string;
  amount: number;
  type: CashbookType;
  category: CashbookCategory;
  description: string | null;
  date: string;
  createdAt: string;
}

export interface SalaryBreakdown {
  totalDays: number;
  workingDays: number;
  presentDays: number;
  absentDays: number;
  halfDays: number;
  paidLeaves: number;
  unpaidLeaves: number;
  holidays: number;
  weekOffs: number;
  overtimeHours: number;
  /** Hourly staff: paid hours in the month (worked hours + paid leave at shift hours). */
  paidHours: number;
  lateDays: number;
  lateFine: number;
  earnedSalary: number;
  totalPaid: number;
  balanceDue: number;
}
