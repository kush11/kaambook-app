import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';
import { drizzle, type ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

let expo: SQLiteDatabase;
let _db: ExpoSQLiteDatabase<typeof schema>;

export function getDb() {
  if (!_db) {
    expo = openDatabaseSync('hisabpagar.db');
    expo.execSync('PRAGMA journal_mode = WAL;');
    expo.execSync('PRAGMA foreign_keys = ON;');
    _db = drizzle(expo, { schema });
    createTables();
  }
  return _db;
}

function createTables() {
  expo.execSync(`
    CREATE TABLE IF NOT EXISTS businesses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'general',
      address TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );
  `);

  expo.execSync(`
    CREATE TABLE IF NOT EXISTS staff (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL REFERENCES businesses(id),
      name TEXT NOT NULL,
      phone TEXT,
      photo_uri TEXT,
      salary_type TEXT NOT NULL DEFAULT 'monthly',
      salary_amount REAL NOT NULL DEFAULT 0,
      week_off INTEGER NOT NULL DEFAULT -1,
      week_off_days TEXT,
      overtime_rate REAL NOT NULL DEFAULT 0,
      joining_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL
    );
  `);

  try {
    expo.execSync(`ALTER TABLE staff ADD COLUMN overtime_rate REAL NOT NULL DEFAULT 0;`);
  } catch (e) {
    // Column already exists
  }

  try {
    expo.execSync(`ALTER TABLE staff ADD COLUMN week_off_days TEXT;`);
  } catch (e) {
    // Column already exists
  }
  // One-time migration: carry each staff's legacy single week_off into the new list column.
  // Runs once because new/edited rows always have a non-NULL week_off_days.
  try {
    expo.execSync(`UPDATE staff SET week_off_days = CASE WHEN week_off >= 0 THEN CAST(week_off AS TEXT) ELSE '' END WHERE week_off_days IS NULL;`);
  } catch (e) {
    // ignore
  }

  expo.execSync(`
    CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      staff_id TEXT NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      status TEXT NOT NULL,
      note TEXT,
      overtime_hours REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);

  expo.execSync(`
    CREATE UNIQUE INDEX IF NOT EXISTS attendance_staff_date_idx ON attendance(staff_id, date);
  `);

  expo.execSync(`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      staff_id TEXT NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      mode TEXT NOT NULL DEFAULT 'cash',
      date TEXT NOT NULL,
      note TEXT,
      created_at TEXT NOT NULL
    );
  `);

  expo.execSync(`
    CREATE TABLE IF NOT EXISTS advances (
      id TEXT PRIMARY KEY,
      staff_id TEXT NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
      total_amount REAL NOT NULL,
      remaining_amount REAL NOT NULL,
      emi_amount REAL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL
    );
  `);

  expo.execSync(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  expo.execSync(`
    CREATE TABLE IF NOT EXISTS cashbook (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL REFERENCES businesses(id),
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
}

// For backward compat — lazy proxy
export const db = new Proxy({} as ExpoSQLiteDatabase<typeof schema>, {
  get(_target, prop: string) {
    const database = getDb();
    return database[prop as keyof typeof database];
  },
});

export function initDatabase() {
  getDb();
}

export { expo as rawDb };
