import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { db, rawDb } from '../db/client';
import { businesses, staff, attendance, payments, advances, cashbook, settings } from '../db/schema';
import dayjs from 'dayjs';
import { track } from './analytics';
import { useSettingsStore } from '../stores/useSettingsStore';

export interface BackupData {
  version: number;
  createdAt: string;
  businesses: any[];
  staff: any[];
  attendance: any[];
  payments: any[];
  advances: any[];
  cashbook: any[];
  settings: any[];
}

/** Everything in the local database, as one JSON-serialisable object. */
export async function buildBackupData(): Promise<BackupData> {
  return {
    version: 2,
    createdAt: dayjs().toISOString(),
    businesses: await db.select().from(businesses),
    staff: await db.select().from(staff),
    attendance: await db.select().from(attendance),
    payments: await db.select().from(payments),
    advances: await db.select().from(advances),
    cashbook: await db.select().from(cashbook),
    settings: await db.select().from(settings),
  };
}

export async function createBackup(): Promise<void> {
  const data = await buildBackupData();
  const json = JSON.stringify(data, null, 2);
  const fileName = `hisabpagar-backup-${dayjs().format('YYYY-MM-DD-HHmm')}.json`;
  const file = new File(Paths.cache, fileName);
  if (!file.exists) {
    file.create();
  }
  file.write(json);

  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Save Hisab Pagar Backup',
  });
  track('backup_created', { staff_count: data.staff.length });
  await useSettingsStore.getState().markBackupDone();
}

export async function restoreBackup(): Promise<boolean> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  });

  if (result.canceled) return false;

  const pickedFile = result.assets[0];
  const file = new File(pickedFile.uri);
  const json = await file.text();
  await restoreBackupData(JSON.parse(json) as BackupData, 'file');
  return true;
}

/** Replaces the whole local database with a backup. Throws on an invalid backup. */
export async function restoreBackupData(data: BackupData, source: 'file' | 'drive'): Promise<void> {
  if (!data.version || !data.businesses || !data.staff) {
    throw new Error('Invalid backup file');
  }

  // Older (v1) backups didn't include advances/cashbook — default to empty.
  const advancesData = data.advances ?? [];
  const cashbookData = data.cashbook ?? [];

  // Replace everything atomically: if any step fails, the whole restore rolls
  // back so we never leave the database half-wiped.
  await rawDb.withTransactionAsync(async () => {
    // Clear existing data — children before parents to satisfy foreign keys.
    await db.delete(attendance);
    await db.delete(payments);
    await db.delete(advances);
    await db.delete(cashbook);
    await db.delete(staff);
    await db.delete(businesses);
    await db.delete(settings);

    // Restore data — parents before children.
    if (data.businesses.length > 0) {
      await db.insert(businesses).values(data.businesses);
    }
    if (data.staff.length > 0) {
      await db.insert(staff).values(data.staff);
    }
    if (data.attendance.length > 0) {
      await db.insert(attendance).values(data.attendance);
    }
    if (data.payments.length > 0) {
      await db.insert(payments).values(data.payments);
    }
    if (advancesData.length > 0) {
      await db.insert(advances).values(advancesData);
    }
    if (cashbookData.length > 0) {
      await db.insert(cashbook).values(cashbookData);
    }
    if (data.settings.length > 0) {
      await db.insert(settings).values(data.settings);
    }
  });

  track('backup_restored', {
    source,
    backup_version: data.version,
    staff_count: data.staff.length,
    business_count: data.businesses.length,
  });
}
