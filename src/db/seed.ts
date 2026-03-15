import { db } from './client';
import { businesses, settings } from './schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'expo-crypto';
import dayjs from 'dayjs';

export async function seedDatabase() {
  // Check if already seeded
  const existing = await db.select().from(settings).where(eq(settings.key, 'seeded'));
  if (existing.length > 0) return;

  const businessId = randomUUID();
  const now = dayjs().toISOString();

  // Create default business
  await db.insert(businesses).values({
    id: businessId,
    name: 'My Business',
    type: 'general',
    isActive: 1,
    createdAt: now,
  });

  // Set active business
  await db.insert(settings).values([
    { key: 'active_business_id', value: businessId },
    { key: 'language', value: 'en' },
    { key: 'seeded', value: '1' },
    { key: 'reminder_enabled', value: '0' },
    { key: 'reminder_time', value: '20:00' },
  ]);
}
