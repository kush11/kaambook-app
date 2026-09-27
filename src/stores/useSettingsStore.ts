import { create } from 'zustand';
import { db } from '../db/client';
import { settings } from '../db/schema';
import { eq } from 'drizzle-orm';
import dayjs from 'dayjs';
import i18n, { setLocale } from '../i18n';
import { track, identifyOwner, flushAnalytics } from '../utils/analytics';
import { scheduleAttendanceReminder, requestNotificationPermissions } from '../utils/notifications';

interface SettingsState {
  language: string;
  reminderEnabled: boolean;
  reminderTime: string;
  activeBusinessId: string;
  isOnboarded: boolean;
  isLoading: boolean;
  ownerPhone: string;
  phonePromptDismissed: boolean;
  lastBackupAt: string;
  backupReminderSnoozedAt: string;
  /** Google account connected for Drive auto-backup; empty when not connected. */
  driveEmail: string;
  driveLastBackupAt: string;
  loadSettings: () => Promise<void>;
  setSetting: (key: string, value: string) => Promise<void>;
  setLanguage: (lang: string) => Promise<void>;
  setActiveBusinessId: (id: string) => Promise<void>;
  setReminderEnabled: (enabled: boolean) => Promise<void>;
  /** Turns the daily reminder on from a flow other than Settings; false if permission was refused. */
  autoEnableReminder: (source: 'first_staff') => Promise<boolean>;
  setReminderTime: (time: string) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  setOwnerPhone: (phone: string, source: 'onboarding' | 'home_prompt' | 'settings') => Promise<void>;
  dismissPhonePrompt: () => Promise<void>;
  markBackupDone: () => Promise<void>;
  snoozeBackupReminder: () => Promise<void>;
  setDriveAccount: (email: string) => Promise<void>;
  markDriveBackupDone: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  language: 'en',
  reminderEnabled: false,
  reminderTime: '20:00',
  activeBusinessId: '',
  isOnboarded: false,
  isLoading: true,
  ownerPhone: '',
  phonePromptDismissed: false,
  lastBackupAt: '',
  backupReminderSnoozedAt: '',
  driveEmail: '',
  driveLastBackupAt: '',

  loadSettings: async () => {
    const rows = await db.select().from(settings);
    const map: Record<string, string> = {};
    rows.forEach(r => { map[r.key] = r.value; });

    const lang = map['language'] || 'en';
    setLocale(lang);

    set({
      language: lang,
      reminderEnabled: map['reminder_enabled'] === '1',
      reminderTime: map['reminder_time'] || '20:00',
      activeBusinessId: map['active_business_id'] || '',
      isOnboarded: map['onboarded'] === '1',
      ownerPhone: map['owner_phone'] || '',
      phonePromptDismissed: map['phone_prompt_dismissed'] === '1',
      lastBackupAt: map['last_backup_at'] || '',
      backupReminderSnoozedAt: map['backup_reminder_snoozed_at'] || '',
      driveEmail: map['drive_account_email'] || '',
      driveLastBackupAt: map['drive_last_backup_at'] || '',
      isLoading: false,
    });
  },

  setSetting: async (key: string, value: string) => {
    await db.insert(settings).values({ key, value })
      .onConflictDoUpdate({ target: settings.key, set: { value } });
  },

  setActiveBusinessId: async (id: string) => {
    await get().setSetting('active_business_id', id);
    set({ activeBusinessId: id });
  },

  setLanguage: async (lang: string) => {
    setLocale(lang);
    await get().setSetting('language', lang);
    set({ language: lang });
    track('language_changed', { language: lang });
    // The scheduled reminder keeps the text it was created with — recreate it in the new language.
    if (get().reminderEnabled) {
      const [h, m] = get().reminderTime.split(':').map(Number);
      scheduleAttendanceReminder(h, m);
    }
  },

  setReminderEnabled: async (enabled: boolean) => {
    await get().setSetting('reminder_enabled', enabled ? '1' : '0');
    set({ reminderEnabled: enabled });
    track('reminder_toggled', { enabled });
  },

  // Users who add staff but never mark attendance are the biggest drop-off, and
  // the reminder was off by default, so the first staff add switches it on.
  autoEnableReminder: async (source) => {
    if (get().reminderEnabled) return true;
    const granted = await requestNotificationPermissions();
    track('reminder_auto_enabled', { source, granted });
    if (!granted) return false;
    const [h, m] = get().reminderTime.split(':').map(Number);
    await scheduleAttendanceReminder(h, m);
    await get().setSetting('reminder_enabled', '1');
    set({ reminderEnabled: true });
    return true;
  },

  setReminderTime: async (time: string) => {
    await get().setSetting('reminder_time', time);
    set({ reminderTime: time });
    track('reminder_time_changed', { time });
  },

  completeOnboarding: async () => {
    await get().setSetting('onboarded', '1');
    set({ isOnboarded: true });
    track('onboarding_completed', { language: get().language, has_phone: !!get().ownerPhone });
  },

  // Saves the app owner's phone number and links it as the analytics identity
  // so we can call users for feedback and see their full activity history.
  setOwnerPhone: async (phone: string, source) => {
    // Last 10 digits, so "+91 98…" and "98…" are the same person.
    const digits = (phone || '').replace(/\D/g, '').slice(-10);
    if (!digits) return;
    await get().setSetting('owner_phone', digits);
    set({ ownerPhone: digits });
    identifyOwner(digits, { language: get().language });
    track('owner_phone_captured', { source });
    flushAnalytics();
  },

  dismissPhonePrompt: async () => {
    await get().setSetting('phone_prompt_dismissed', '1');
    set({ phonePromptDismissed: true });
    track('phone_prompt_dismissed');
  },

  markBackupDone: async () => {
    const now = dayjs().toISOString();
    await get().setSetting('last_backup_at', now);
    set({ lastBackupAt: now });
  },

  snoozeBackupReminder: async () => {
    const now = dayjs().toISOString();
    await get().setSetting('backup_reminder_snoozed_at', now);
    set({ backupReminderSnoozedAt: now });
  },

  setDriveAccount: async (email: string) => {
    await get().setSetting('drive_account_email', email);
    if (!email) await get().setSetting('drive_last_backup_at', '');
    set({ driveEmail: email, ...(email ? {} : { driveLastBackupAt: '' }) });
  },

  markDriveBackupDone: async () => {
    const now = dayjs().toISOString();
    await get().setSetting('drive_last_backup_at', now);
    // Drive counts as a backup for the manual-backup reminder too.
    await get().setSetting('last_backup_at', now);
    set({ driveLastBackupAt: now, lastBackupAt: now });
  },
}));
