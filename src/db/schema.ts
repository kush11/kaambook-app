import { sqliteTable, text, integer, real, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const businesses = sqliteTable('businesses', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull().default('general'),
  address: text('address'),
  isActive: integer('is_active').notNull().default(1),
  createdAt: text('created_at').notNull(),
});

export const staff = sqliteTable('staff', {
  id: text('id').primaryKey(),
  businessId: text('business_id').notNull().references(() => businesses.id),
  name: text('name').notNull(),
  phone: text('phone'),
  photoUri: text('photo_uri'),
  salaryType: text('salary_type').notNull().default('monthly'), // monthly, daily, weekly
  salaryAmount: real('salary_amount').notNull().default(0),
  weekOff: integer('week_off').notNull().default(-1), // -1 = none, 0=Sun, 6=Sat
  overtimeRate: real('overtime_rate').notNull().default(0),
  joiningDate: text('joining_date').notNull(),
  status: text('status').notNull().default('active'), // active, inactive
  createdAt: text('created_at').notNull(),
});

export const attendance = sqliteTable('attendance', {
  id: text('id').primaryKey(),
  staffId: text('staff_id').notNull().references(() => staff.id, { onDelete: 'cascade' }),
  date: text('date').notNull(), // YYYY-MM-DD
  status: text('status').notNull(), // present, absent, half_day, paid_leave, unpaid_leave, holiday, week_off
  note: text('note'),
  overtimeHours: real('overtime_hours').notNull().default(0),
  createdAt: text('created_at').notNull(),
}, (table) => [
  uniqueIndex('attendance_staff_date_idx').on(table.staffId, table.date),
]);

export const payments = sqliteTable('payments', {
  id: text('id').primaryKey(),
  staffId: text('staff_id').notNull().references(() => staff.id, { onDelete: 'cascade' }),
  amount: real('amount').notNull(),
  type: text('type').notNull(), // salary, advance, bonus, penalty
  mode: text('mode').notNull().default('cash'), // cash, upi, bank
  date: text('date').notNull(),
  note: text('note'),
  createdAt: text('created_at').notNull(),
});

export const advances = sqliteTable('advances', {
  id: text('id').primaryKey(),
  staffId: text('staff_id').notNull().references(() => staff.id, { onDelete: 'cascade' }),
  totalAmount: real('total_amount').notNull(),
  remainingAmount: real('remaining_amount').notNull(),
  emiAmount: real('emi_amount'),
  status: text('status').notNull().default('active'), // active, completed
  createdAt: text('created_at').notNull(),
});

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export const cashbook = sqliteTable('cashbook', {
  id: text('id').primaryKey(),
  businessId: text('business_id').notNull().references(() => businesses.id),
  amount: real('amount').notNull(),
  type: text('type').notNull(), // income, expense
  category: text('category').notNull(), // wages, material, transport, food, rent, other, sales, payment_received, other_income
  description: text('description'),
  date: text('date').notNull(),
  createdAt: text('created_at').notNull(),
});
