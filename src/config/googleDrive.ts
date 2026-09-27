/**
 * Google Drive automatic backup.
 *
 * The app signs the owner in with Google and keeps one JSON backup in the
 * app-data folder of their own Drive (hidden from the user, only this app can
 * read it, deleted if they disconnect the app). Nothing is stored on our side.
 *
 * Setup — see docs/google-drive-setup.md:
 *   Google Cloud → APIs & Services → Credentials → OAuth client (Android),
 *   package com.kaambook.app + the Play app-signing SHA-1, then paste the
 *   client ID below.
 *
 * Empty string = feature hidden everywhere (safe no-op), like POSTHOG_API_KEY.
 */
export const GOOGLE_ANDROID_CLIENT_ID = '172168001236-bql8gqbjupgusussd2mm7vg4s005iv6r.apps.googleusercontent.com';

/** Single file, overwritten on every backup. */
export const DRIVE_BACKUP_FILE_NAME = 'hisabpagar-backup.json';

/** A backup is uploaded on app open at most once per this many hours. */
export const AUTO_BACKUP_MIN_HOURS = 20;
