import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { db } from '../db/client';
import { businesses, staff, attendance, payments, settings } from '../db/schema';
import dayjs from 'dayjs';

interface BackupData {
  version: 1;
  createdAt: string;
  businesses: any[];
  staff: any[];
  attendance: any[];
  payments: any[];
  settings: any[];
}

export async function createBackup(): Promise<void> {
  const data: BackupData = {
    version: 1,
    createdAt: dayjs().toISOString(),
    businesses: await db.select().from(businesses),
    staff: await db.select().from(staff),
    attendance: await db.select().from(attendance),
    payments: await db.select().from(payments),
    settings: await db.select().from(settings),
  };

  const json = JSON.stringify(data, null, 2);
  const fileName = `kaambook-backup-${dayjs().format('YYYY-MM-DD-HHmm')}.json`;
  const file = new File(Paths.cache, fileName);
  if (!file.exists) {
    file.create();
  }
  file.write(json);

  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Save KaamBook Backup',
  });
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
  const data: BackupData = JSON.parse(json);

  if (!data.version || !data.businesses || !data.staff) {
    throw new Error('Invalid backup file');
  }

  // Clear existing data
  await db.delete(attendance);
  await db.delete(payments);
  await db.delete(staff);
  await db.delete(businesses);
  await db.delete(settings);

  // Restore data
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
  if (data.settings.length > 0) {
    await db.insert(settings).values(data.settings);
  }

  return true;
}
