import { create } from 'zustand';
import { db } from '../db/client';
import { settings } from '../db/schema';
import { eq } from 'drizzle-orm';
import i18n, { setLocale } from '../i18n';
import { track, identifyOwner, flushAnalytics } from '../utils/analytics';

interface SettingsState {
  language: string;
  reminderEnabled: boolean;
  reminderTime: string;
  activeBusinessId: string;
  isOnboarded: boolean;
  isLoading: boolean;
  ownerPhone: string;
  phonePromptDismissed: boolean;
  loadSettings: () => Promise<void>;
  setSetting: (key: string, value: string) => Promise<void>;
  setLanguage: (lang: string) => Promise<void>;
  setActiveBusinessId: (id: string) => Promise<void>;
  setReminderEnabled: (enabled: boolean) => Promise<void>;
  setReminderTime: (time: string) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  setOwnerPhone: (phone: string, source: 'onboarding' | 'home_prompt' | 'settings') => Promise<void>;
  dismissPhonePrompt: () => Promise<void>;
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
  },

  setReminderEnabled: async (enabled: boolean) => {
    await get().setSetting('reminder_enabled', enabled ? '1' : '0');
    set({ reminderEnabled: enabled });
  },

  setReminderTime: async (time: string) => {
    await get().setSetting('reminder_time', time);
    set({ reminderTime: time });
  },

  completeOnboarding: async () => {
    await get().setSetting('onboarded', '1');
    set({ isOnboarded: true });
    track('onboarding_completed', { language: get().language, has_phone: !!get().ownerPhone });
  },

  // Saves the app owner's phone number and links it as the analytics identity
  // so we can call users for feedback and see their full activity history.
  setOwnerPhone: async (phone: string, source) => {
    const digits = (phone || '').replace(/\D/g, '');
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
}));
