/**
 * Google Drive automatic backup.
 *
 * Flow: the owner connects their Google account once (Settings, the Home card,
 * or "Restore" on onboarding). We keep the OAuth refresh token in SecureStore
 * and upload the same JSON backup that "Backup Data" shares, into Drive's
 * app-data folder, at most once every AUTO_BACKUP_MIN_HOURS on app open. On a
 * fresh install the owner connects again and the backup is pulled back.
 *
 * Every function here is a safe no-op when GOOGLE_ANDROID_CLIENT_ID is empty.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import dayjs from 'dayjs';
import { GOOGLE_ANDROID_CLIENT_ID, DRIVE_BACKUP_FILE_NAME, AUTO_BACKUP_MIN_HOURS } from '../config/googleDrive';
import { PACKAGE } from '../config/links';
import { buildBackupData, restoreBackupData, type BackupData } from './backup';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useBusinessStore } from '../stores/useBusinessStore';
import { useStaffStore } from '../stores/useStaffStore';
import { track, trackError, identifyOwner } from './analytics';

WebBrowser.maybeCompleteAuthSession();

// drive.appdata is a non-sensitive scope: only the app's own hidden folder,
// never the user's real files. openid+email just tells us which account it is.
const SCOPES = ['https://www.googleapis.com/auth/drive.appdata', 'openid', 'email'];
const TOKENS_KEY = 'drive_tokens';
const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD = 'https://www.googleapis.com/upload/drive/v3';

// Google accepts the package name as a custom scheme for Android OAuth clients;
// app.json lists it under "scheme" so the redirect reopens the app.
const redirectUri = AuthSession.makeRedirectUri({ native: `${PACKAGE}:/oauth2redirect` });

export type DriveConnectSource = 'settings' | 'home_card' | 'onboarding';

interface StoredTokens {
  accessToken: string;
  refreshToken?: string;
  /** Unix ms. */
  expiresAt: number;
}

export function isDriveConfigured(): boolean {
  return !!GOOGLE_ANDROID_CLIENT_ID;
}

// ---------------------------------------------------------------------------
// Tokens

async function saveTokens(t: AuthSession.TokenResponse, previous?: StoredTokens | null): Promise<void> {
  const issuedAt = (t.issuedAt ?? Math.floor(Date.now() / 1000)) * 1000;
  const stored: StoredTokens = {
    accessToken: t.accessToken,
    // A refresh never returns a new refresh token — keep the one from consent.
    refreshToken: t.refreshToken ?? previous?.refreshToken,
    expiresAt: issuedAt + (t.expiresIn ?? 3600) * 1000,
  };
  await SecureStore.setItemAsync(TOKENS_KEY, JSON.stringify(stored));
}

async function loadTokens(): Promise<StoredTokens | null> {
  try {
    const raw = await SecureStore.getItemAsync(TOKENS_KEY);
    return raw ? (JSON.parse(raw) as StoredTokens) : null;
  } catch {
    return null;
  }
}

/** Returns a usable access token, refreshing it if needed, or null when not connected. */
async function getAccessToken(): Promise<string | null> {
  if (!isDriveConfigured()) return null;
  const tokens = await loadTokens();
  if (!tokens) return null;
  if (tokens.expiresAt - Date.now() > 60_000) return tokens.accessToken;
  if (!tokens.refreshToken) return null;
  const fresh = await AuthSession.refreshAsync(
    { clientId: GOOGLE_ANDROID_CLIENT_ID, refreshToken: tokens.refreshToken },
    Google.discovery,
  );
  await saveTokens(fresh, tokens);
  return fresh.accessToken;
}

function emailFromIdToken(idToken?: string): string {
  try {
    if (!idToken) return '';
    const payload = idToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = JSON.parse(globalThis.atob(payload));
    return typeof json.email === 'string' ? json.email : '';
  } catch {
    return '';
  }
}

// ---------------------------------------------------------------------------
// Drive calls

async function driveFetch(token: string, url: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init.headers || {}) },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Drive ${res.status}: ${body.slice(0, 200)}`);
  }
  return res;
}

async function findBackupFile(token: string): Promise<{ id: string; modifiedTime: string } | null> {
  const q = encodeURIComponent(`name='${DRIVE_BACKUP_FILE_NAME}' and trashed=false`);
  const res = await driveFetch(
    token,
    `${DRIVE_API}/files?spaces=appDataFolder&fields=files(id,modifiedTime)&q=${q}&orderBy=modifiedTime desc&pageSize=1`,
  );
  const json = await res.json();
  return json.files?.[0] ?? null;
}

export type UploadResult = 'uploaded' | 'not_connected' | 'skipped_empty';

/**
 * Uploads the current database as the single Drive backup file.
 * Refuses to overwrite an existing backup with an empty database, so a fresh
 * install that connects Drive before restoring can never wipe the real backup.
 */
export async function uploadBackupToDrive(auto: boolean): Promise<UploadResult> {
  const token = await getAccessToken();
  if (!token) return 'not_connected';

  const data = await buildBackupData();
  const existing = await findBackupFile(token);
  const isEmpty = data.staff.length === 0 && data.attendance.length === 0 && data.cashbook.length === 0;
  if (isEmpty && existing) {
    track('drive_backup_skipped_empty', { auto });
    return 'skipped_empty';
  }

  const json = JSON.stringify(data);
  if (existing) {
    await driveFetch(token, `${DRIVE_UPLOAD}/files/${existing.id}?uploadType=media`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: json,
    });
  } else {
    const boundary = `hisabpagar${Date.now()}`;
    const meta = JSON.stringify({ name: DRIVE_BACKUP_FILE_NAME, parents: ['appDataFolder'] });
    const body =
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n` +
      `--${boundary}\r\nContent-Type: application/json\r\n\r\n${json}\r\n--${boundary}--`;
    await driveFetch(token, `${DRIVE_UPLOAD}/files?uploadType=multipart`, {
      method: 'POST',
      headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
      body,
    });
  }

  await useSettingsStore.getState().markDriveBackupDone();
  track('drive_backup_uploaded', { auto, staff_count: data.staff.length, bytes: json.length });
  return 'uploaded';
}

async function fetchBackupFromDrive(token: string): Promise<BackupData | null> {
  const existing = await findBackupFile(token);
  if (!existing) return null;
  const res = await driveFetch(token, `${DRIVE_API}/files/${existing.id}?alt=media`);
  return (await res.json()) as BackupData;
}

export type RestoreResult = 'restored' | 'none' | 'not_connected';

/**
 * Replaces the local database with the Drive backup and reloads every store.
 * The backup's settings row set is replaced too, so the Drive connection made
 * on this phone is written back afterwards.
 */
export async function restoreFromDrive(): Promise<RestoreResult> {
  const token = await getAccessToken();
  if (!token) return 'not_connected';
  const data = await fetchBackupFromDrive(token);
  if (!data) {
    track('drive_restore_empty');
    return 'none';
  }

  const settingsStore = useSettingsStore.getState();
  const email = settingsStore.driveEmail;
  await restoreBackupData(data, 'drive');
  await settingsStore.setSetting('drive_account_email', email);
  await settingsStore.setSetting('drive_last_backup_at', data.createdAt);
  await settingsStore.loadSettings();
  const s = useSettingsStore.getState();
  await useBusinessStore.getState().loadBusinesses();
  if (s.activeBusinessId) await useStaffStore.getState().loadStaff(s.activeBusinessId);
  if (s.ownerPhone) identifyOwner(s.ownerPhone, { language: s.language });
  track('drive_restore_completed', { staff_count: data.staff.length, backup_created_at: data.createdAt });
  return 'restored';
}

export async function disconnectDrive(): Promise<void> {
  const tokens = await loadTokens();
  if (tokens?.refreshToken || tokens?.accessToken) {
    try {
      await AuthSession.revokeAsync(
        { token: tokens.refreshToken || tokens.accessToken, clientId: GOOGLE_ANDROID_CLIENT_ID },
        Google.discovery,
      );
    } catch (e) {
      trackError('drive_revoke', e);
    }
  }
  await SecureStore.deleteItemAsync(TOKENS_KEY).catch(() => {});
  await useSettingsStore.getState().setDriveAccount('');
  track('drive_disconnected');
}

// ---------------------------------------------------------------------------
// Automatic backup

let autoBackupInFlight = false;

/** Called on app open / foreground. Silent: failures are only reported to analytics. */
export async function maybeAutoBackup(): Promise<void> {
  if (!isDriveConfigured() || autoBackupInFlight) return;
  const { driveEmail, driveLastBackupAt } = useSettingsStore.getState();
  if (!driveEmail) return;
  if (driveLastBackupAt && dayjs().diff(dayjs(driveLastBackupAt), 'hour') < AUTO_BACKUP_MIN_HOURS) return;
  autoBackupInFlight = true;
  try {
    await uploadBackupToDrive(true);
  } catch (e) {
    trackError('drive_auto_backup', e);
  } finally {
    autoBackupInFlight = false;
  }
}

// ---------------------------------------------------------------------------
// Connect hook

/**
 * Google sign-in for Drive backup. `connect()` resolves true once tokens are
 * stored and the account email is saved in settings, false if the user
 * cancelled or sign-in failed.
 */
export function useDriveConnect(source: DriveConnectSource) {
  const [request, response, promptAsync] = Google.useAuthRequest({
    // The hook needs a client id even when the feature is off; connect() is gated below.
    androidClientId: GOOGLE_ANDROID_CLIENT_ID || 'unconfigured',
    scopes: SCOPES,
    redirectUri,
    // Authorization-code flow with PKCE: Google returns a refresh token, so the
    // daily upload never needs the sign-in sheet again.
    responseType: AuthSession.ResponseType.Code,
    extraParams: { access_type: 'offline' },
  });
  const [busy, setBusy] = useState(false);
  const pending = useRef<((ok: boolean) => void) | null>(null);

  useEffect(() => {
    if (!response) return;
    (async () => {
      if (response.type === 'success') {
        // The provider exchanges the code itself; wait for the token response.
        if (!response.authentication) return;
        try {
          await saveTokens(response.authentication);
          const email = emailFromIdToken(response.authentication.idToken);
          await useSettingsStore.getState().setDriveAccount(email);
          track('drive_connected', { source, has_email: !!email });
          pending.current?.(true);
        } catch (e) {
          trackError('drive_connect', e);
          pending.current?.(false);
        }
      } else {
        if (response.type === 'error') trackError('drive_connect', response.error);
        else track('drive_connect_cancelled', { source, type: response.type });
        pending.current?.(false);
      }
      pending.current = null;
      setBusy(false);
    })();
  }, [response]);

  const connect = useCallback(async (): Promise<boolean> => {
    if (!isDriveConfigured() || !request) return false;
    setBusy(true);
    return new Promise<boolean>((resolve) => {
      pending.current = resolve;
      promptAsync().catch((e) => {
        trackError('drive_prompt', e);
        pending.current = null;
        setBusy(false);
        resolve(false);
      });
    });
  }, [request, promptAsync]);

  return { connect, busy, ready: isDriveConfigured() && !!request };
}
