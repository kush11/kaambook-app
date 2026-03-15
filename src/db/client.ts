import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';
import { drizzle, type ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

let expo: SQLiteDatabase;
let _db: ExpoSQLiteDatabase<typeof schema>;

export function getDb() {
  if (!_db) {
    expo = openDatabaseSync('kaambook.db');
    expo.execSync('PRAGMA journal_mode = WAL;');
    expo.execSync('PRAGMA foreign_keys = ON;');
    _db = drizzle(expo, { schema });
  }
  return _db;
}

// For backward compat — lazy proxy
export const db = new Proxy({} as ExpoSQLiteDatabase<typeof schema>, {
  get(_target, prop: string) {
    const database = getDb();
    return database[prop as keyof typeof database];
  },
});

export function initDatabase() {
  const database = getDb();

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

export { expo as rawDb };
