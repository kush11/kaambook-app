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
import * as Linking from 'expo-linking';
import dayjs from 'dayjs';
import { Alert } from 'react-native';
import i18n from '../i18n';
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
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
const SCOPES = [DRIVE_SCOPE, 'openid', 'email'];

/**
 * Thrown when the Google account is connected without Drive access. Google's
 * consent screen lets people untick the Drive box while still signing in, and
 * every Drive call then answers 403 "insufficient authentication scopes".
 */
export class DriveScopeError extends Error {
  constructor() {
    super('drive_scope_missing');
    this.name = 'DriveScopeError';
  }
}

export function isDriveScopeError(e: unknown): boolean {
  return e instanceof DriveScopeError || (e as Error)?.name === 'DriveScopeError';
}

/** True when the granted scope string includes Drive. A missing string means Google didn't say, so assume granted. */
export function hasDriveScope(scope: string | undefined): boolean {
  if (scope === undefined || scope === null) return true;
  return scope.split(/[\s,]+/).includes(DRIVE_SCOPE);
}

/** True for Drive's 403 when the token lacks the Drive scope (not for storage-full, which is also 403). */
export function isInsufficientScopeResponse(status: number, body: string): boolean {
  return status === 403 && /insufficient authentication scopes|ACCESS_TOKEN_SCOPE_INSUFFICIENT|insufficientPermissions/i.test(body);
}
const TOKENS_KEY = 'drive_tokens';
// The PKCE verifier + state of an in-flight sign-in. Some phones (MIUI in
// particular) kill the app while Google's sheet is open; the redirect then
// cold-starts the app and the in-memory request is gone, so we finish from here.
const PENDING_KEY = 'drive_pending_auth';
const PENDING_MAX_AGE_MS = 10 * 60 * 1000;

interface PendingAuth {
  state: string;
  codeVerifier?: string;
  source: DriveConnectSource;
  createdAt: number;
}
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
    if (isInsufficientScopeResponse(res.status, body)) {
      // The saved grant can never work; drop it so the app asks to connect again
      // instead of failing silently on every app open.
      await forgetDriveConnection();
      track('drive_scope_lost');
      throw new DriveScopeError();
    }
    throw new Error(`Drive ${res.status}: ${body.slice(0, 200)}`);
  }
  return res;
}

/** Removes the stored tokens and account so the UI shows "Connect" again. */
async function forgetDriveConnection(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKENS_KEY).catch(() => {});
  await useSettingsStore.getState().setDriveAccount('');
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

export interface DriveStorage {
  /** Bytes used across the whole Google account (Drive, Gmail, Photos). */
  usage: number;
  /** Bytes available in total, or null when the account has unlimited storage. */
  limit: number | null;
}

/** The Google account's storage quota, or null when not connected. */
export async function getDriveStorage(): Promise<DriveStorage | null> {
  const token = await getAccessToken();
  if (!token) return null;
  const res = await driveFetch(token, `${DRIVE_API}/about?fields=storageQuota(limit,usage)`);
  const { storageQuota } = await res.json();
  return {
    usage: Number(storageQuota?.usage ?? 0),
    limit: storageQuota?.limit ? Number(storageQuota.limit) : null,
  };
}

async function revokeTokens(tokens: StoredTokens | null): Promise<void> {
  if (!tokens?.refreshToken && !tokens?.accessToken) return;
  try {
    await AuthSession.revokeAsync(
      { token: tokens.refreshToken || tokens.accessToken, clientId: GOOGLE_ANDROID_CLIENT_ID },
      Google.discovery,
    );
  } catch (e) {
    trackError('drive_revoke', e);
  }
}

/**
 * Switches the backup to another Google account. `connect` comes from
 * useDriveConnect(..., { selectAccount: true }). The old account keeps its last
 * backup; its access is revoked only after the new account is connected, so a
 * cancelled switch leaves backup running as before.
 */
export async function changeDriveAccount(connect: () => Promise<boolean>): Promise<boolean> {
  const previous = await loadTokens();
  const previousEmail = useSettingsStore.getState().driveEmail;
  const ok = await connect();
  if (!ok) return false;
  const email = useSettingsStore.getState().driveEmail;
  // Revoking ends the whole grant for that account, so skip it when the same account was picked again.
  if (email !== previousEmail) await revokeTokens(previous);
  track('drive_account_changed', { same_account: email === previousEmail });
  return true;
}

export async function disconnectDrive(): Promise<void> {
  await revokeTokens(await loadTokens());
  await SecureStore.deleteItemAsync(TOKENS_KEY).catch(() => {});
  await useSettingsStore.getState().setDriveAccount('');
  track('drive_disconnected');
}

// ---------------------------------------------------------------------------
// Cold-start completion

async function finishSignIn(tokens: AuthSession.TokenResponse, source: string, coldStart: boolean): Promise<void> {
  if (!hasDriveScope(tokens.scope)) {
    // Signed in but the Drive box was unticked. Revoke so the next attempt shows
    // the full consent screen again, and never save a grant that can't back up.
    track('drive_scope_denied', { source, cold_start: coldStart });
    await revokeTokens({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, expiresAt: 0 });
    throw new DriveScopeError();
  }
  await saveTokens(tokens);
  const email = emailFromIdToken(tokens.idToken);
  await useSettingsStore.getState().setDriveAccount(email);
  track('drive_connected', { source, has_email: !!email, cold_start: coldStart });
}

/**
 * Called once at app start. If the app was launched by Google's redirect URL and
 * a sign-in was pending, exchanges the code and connects the account, then does
 * what the user originally asked for: restore (onboarding) or a first backup.
 * Returns true when it handled a redirect.
 */
export async function completeColdStartAuth(): Promise<boolean> {
  if (!isDriveConfigured()) return false;
  try {
    const url = await Linking.getInitialURL();
    if (!url || !url.includes('oauth2redirect')) return false;
    const raw = await SecureStore.getItemAsync(PENDING_KEY);
    if (!raw) return false;
    await SecureStore.deleteItemAsync(PENDING_KEY);
    const pending = JSON.parse(raw) as PendingAuth;
    const { code, state, error } = Linking.parse(url).queryParams ?? {};
    if (error || typeof code !== 'string' || state !== pending.state) {
      track('drive_connect_cold_start_rejected', { reason: error ? String(error) : 'state_mismatch' });
      return false;
    }
    if (Date.now() - pending.createdAt > PENDING_MAX_AGE_MS) {
      track('drive_connect_cold_start_rejected', { reason: 'expired' });
      return false;
    }
    const tokens = await AuthSession.exchangeCodeAsync(
      {
        clientId: GOOGLE_ANDROID_CLIENT_ID,
        code,
        redirectUri,
        extraParams: pending.codeVerifier ? { code_verifier: pending.codeVerifier } : {},
      },
      Google.discovery,
    );
    await finishSignIn(tokens, pending.source, true);
    if (pending.source === 'onboarding') {
      await restoreFromDrive();
    } else {
      await uploadBackupToDrive(false);
    }
    return true;
  } catch (e) {
    if (isDriveScopeError(e)) showDriveScopeAlert();
    else trackError('drive_connect_cold_start', e);
    return false;
  }
}

/**
 * Tells the owner the Drive box was unticked on Google's screen. `retry`
 * reopens the sign-in; without it (cold start, no hook yet) there is only OK.
 */
export function showDriveScopeAlert(retry?: () => void, onCancel?: () => void): void {
  const buttons: { text: string; style?: 'cancel'; onPress?: () => void }[] = [
    { text: i18n.t(retry ? 'common.cancel' : 'common.ok'), style: 'cancel', onPress: onCancel },
  ];
  if (retry) buttons.push({ text: i18n.t('drive.scope_retry'), onPress: retry });
  // Back button / tapping outside also counts as cancel, so connect() never hangs.
  Alert.alert(i18n.t('drive.scope_title'), i18n.t('drive.scope_missing'), buttons, {
    cancelable: true,
    onDismiss: onCancel,
  });
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
    // A scope error already disconnected Drive and was tracked as drive_scope_lost.
    if (!isDriveScopeError(e)) trackError('drive_auto_backup', e);
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
// Module-level so the auth request isn't rebuilt on every render.
const CONNECT_PARAMS = { access_type: 'offline' };
// Account picker every time, and consent so Google returns a refresh token even
// for an account that connected before.
const SWITCH_PARAMS = { access_type: 'offline', prompt: 'select_account consent' };

export function useDriveConnect(source: DriveConnectSource, options: { selectAccount?: boolean } = {}) {
  const [request, response, promptAsync] = Google.useAuthRequest({
    // The hook needs a client id even when the feature is off; connect() is gated below.
    androidClientId: GOOGLE_ANDROID_CLIENT_ID || 'unconfigured',
    scopes: SCOPES,
    redirectUri,
    // Authorization-code flow with PKCE: Google returns a refresh token, so the
    // daily upload never needs the sign-in sheet again.
    responseType: AuthSession.ResponseType.Code,
    extraParams: options.selectAccount ? SWITCH_PARAMS : CONNECT_PARAMS,
  });
  const [busy, setBusy] = useState(false);
  const pending = useRef<((ok: boolean) => void) | null>(null);

  /** Opens Google's sheet; the effect below settles pending.current when it answers. */
  const startPrompt = useCallback(async (): Promise<void> => {
    if (!request) return;
    const pendingAuth: PendingAuth = {
      state: request.state,
      codeVerifier: request.codeVerifier,
      source,
      createdAt: Date.now(),
    };
    await SecureStore.setItemAsync(PENDING_KEY, JSON.stringify(pendingAuth)).catch(() => {});
    try {
      await promptAsync();
    } catch (e) {
      trackError('drive_prompt', e);
      settle(false);
    }
  }, [request, promptAsync, source]);
  // The scope alert's "Try again" runs after this render's closure is stale.
  const startPromptRef = useRef(startPrompt);
  startPromptRef.current = startPrompt;

  function settle(ok: boolean) {
    pending.current?.(ok);
    pending.current = null;
    setBusy(false);
  }

  useEffect(() => {
    if (!response) return;
    (async () => {
      if (response.type === 'success') {
        // The provider exchanges the code itself; wait for the token response.
        if (!response.authentication) return;
        try {
          await SecureStore.deleteItemAsync(PENDING_KEY).catch(() => {});
          await finishSignIn(response.authentication, source, false);
          settle(true);
        } catch (e) {
          if (isDriveScopeError(e)) {
            // Keep the caller's connect() open: "Try again" reopens Google's
            // sheet and, once Drive is allowed, the caller carries on with its
            // backup or restore as if the first attempt had worked.
            showDriveScopeAlert(
              () => {
                track('drive_scope_retry', { source });
                startPromptRef.current();
              },
              () => settle(false),
            );
          } else {
            trackError('drive_connect', e);
            settle(false);
          }
        }
      } else {
        if (response.type === 'error') trackError('drive_connect', response.error);
        else track('drive_connect_cancelled', { source, type: response.type });
        settle(false);
      }
    })();
  }, [response]);

  const connect = useCallback(async (): Promise<boolean> => {
    if (!isDriveConfigured() || !request) return false;
    setBusy(true);
    return new Promise<boolean>((resolve) => {
      pending.current = resolve;
      startPrompt();
    });
  }, [request, startPrompt]);

  return { connect, busy, ready: isDriveConfigured() && !!request };
}
