import { db } from './client';
import { businesses, settings } from './schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'expo-crypto';
import dayjs from 'dayjs';

export async function seedDatabase() {
  // Check if already seeded
  const existing = await db.select().from(settings).where(eq(settings.key, 'seeded'));
  if (existing.length > 0) return;

  // Only create a default business if none exist (prevents duplicates on re-seed)
  const existingBusinesses = await db.select().from(businesses);
  let activeBusinessId: string;

  if (existingBusinesses.length === 0) {
    activeBusinessId = randomUUID();
    await db.insert(businesses).values({
      id: activeBusinessId,
      name: 'My Business',
      type: 'general',
      isActive: 1,
      createdAt: dayjs().toISOString(),
    });
  } else {
    activeBusinessId = existingBusinesses[0].id;
  }

  // Use onConflictDoNothing so partially-seeded databases don't crash
  await db.insert(settings).values([
    { key: 'active_business_id', value: activeBusinessId },
    { key: 'language', value: 'en' },
    { key: 'seeded', value: '1' },
    { key: 'reminder_enabled', value: '0' },
    { key: 'reminder_time', value: '20:00' },
  ]).onConflictDoNothing();
}
