/**
 * Central analytics wrapper around PostHog.
 *
 * Every call is a safe no-op when POSTHOG_API_KEY is empty or the client
 * failed to initialize, so tracking can never crash the app.
 *
 * Event naming: snake_case, past tense (e.g. "staff_added").
 * Never send money amounts or staff personal data — only counts/types/modes.
 */
import PostHog from 'posthog-react-native';
import { POSTHOG_API_KEY, POSTHOG_HOST } from '../config/telemetry';

let client: PostHog | null = null;

export function initAnalytics(): void {
  if (!POSTHOG_API_KEY || client) return;
  try {
    client = new PostHog(POSTHOG_API_KEY, {
      host: POSTHOG_HOST,
      // Batch events to save battery/data on low-end devices.
      flushAt: 10,
      flushInterval: 30000,
    });
  } catch (e) {
    console.warn('Analytics init failed:', e);
    client = null;
  }
}

/** Track a product event. */
export function track(event: string, properties?: Record<string, unknown>): void {
  try {
    client?.capture(event, properties);
  } catch {
    // never let analytics break the app
  }
}

/**
 * Attach the owner's phone number as the user identity so their whole
 * activity history is visible under one person in PostHog.
 */
export function identifyOwner(phone: string, properties?: Record<string, unknown>): void {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return;
  try {
    client?.identify(digits, { phone: digits, ...properties });
  } catch {
    // ignore
  }
}

/** Set persistent person properties (language, app version, staff count, …). */
export function setUserProperties(properties: Record<string, unknown>): void {
  try {
    client?.capture('$set', { $set: properties });
  } catch {
    // ignore
  }
}

/** Flush pending events immediately (e.g. right after phone capture). */
export function flushAnalytics(): void {
  try {
    client?.flush();
  } catch {
    // ignore
  }
}
