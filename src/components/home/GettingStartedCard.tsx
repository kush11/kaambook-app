import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Card, Text, Button, Icon, IconButton } from 'react-native-paper';
import { router, useFocusEffect } from 'expo-router';
import dayjs from 'dayjs';
import { asc, sql } from 'drizzle-orm';
import { db } from '@/src/db/client';
import { advances, attendance, businesses, payments, settings } from '@/src/db/schema';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { useStaffStore } from '@/src/stores/useStaffStore';
import { track } from '@/src/utils/analytics';
import { colors } from '@/src/theme/colors';
import i18n from '@/src/i18n';

/** Shown during the first SHOW_DAYS days after the first business was created. */
const SHOW_DAYS = 7;
export const SEEN_SALARY_DUE_KEY = 'seen_salary_due';
const DISMISSED_KEY = 'checklist_dismissed';

type Item = 'attendance' | 'payment' | 'salary' | 'tomorrow';

interface Progress {
  attendance: boolean;
  payment: boolean;
  salary: boolean;
  tomorrow: boolean;
  startedAt: string;
  dismissed: boolean;
}

async function loadProgress(): Promise<Progress> {
  const [att] = await db
    .select({ marks: sql<number>`count(*)`, days: sql<number>`count(distinct ${attendance.date})` })
    .from(attendance);
  const [pay] = await db.select({ n: sql<number>`count(*)` }).from(payments);
  const [adv] = await db.select({ n: sql<number>`count(*)` }).from(advances);
  const flags = await db.select().from(settings)
    .where(sql`${settings.key} in (${SEEN_SALARY_DUE_KEY}, ${DISMISSED_KEY})`);
  const flag = (k: string) => flags.some((f) => f.key === k && f.value === '1');
  const [first] = await db.select({ createdAt: businesses.createdAt }).from(businesses)
    .orderBy(asc(businesses.createdAt)).limit(1);
  return {
    attendance: (att?.marks ?? 0) > 0,
    payment: (pay?.n ?? 0) + (adv?.n ?? 0) > 0,
    salary: flag(SEEN_SALARY_DUE_KEY),
    tomorrow: (att?.days ?? 0) >= 2,
    startedAt: first?.createdAt ?? '',
    dismissed: flag(DISMISSED_KEY),
  };
}

interface GettingStartedCardProps {
  /** Changes when today's attendance changes, so the first item ticks without leaving Home. */
  markedToday: number;
}

/**
 * First-week checklist on Home. Most new owners try the app on day one and never open it
 * again, so this walks them to the parts that pay off (dues, salary due) and sets the
 * expectation that attendance is marked every day, with the reminder time shown.
 */
export function GettingStartedCard({ markedToday }: GettingStartedCardProps) {
  const { reminderEnabled, reminderTime, autoEnableReminder, setSetting, isOnboarded } = useSettingsStore();
  const { staffList, firstStaffNudgeId } = useStaffStore();
  const [progress, setProgress] = useState<Progress | null>(null);
  const [hidden, setHidden] = useState(false);

  const refresh = useCallback(() => {
    loadProgress().then(setProgress).catch(() => setProgress(null));
  }, []);
  useFocusEffect(refresh);
  useEffect(refresh, [markedToday, refresh]);

  const activeStaff = staffList.filter((s) => s.status === 'active');
  const items: Item[] = ['attendance', 'payment', 'salary', 'tomorrow'];
  const doneCount = progress ? items.filter((i) => progress[i]).length : 0;
  const allDone = doneCount === items.length;

  useEffect(() => {
    if (progress && allDone && !progress.dismissed) {
      track('checklist_completed');
      setSetting(DISMISSED_KEY, '1');
    }
  }, [allDone, progress, setSetting]);

  if (
    hidden || !progress || !isOnboarded || progress.dismissed || allDone ||
    activeStaff.length === 0 ||
    // The "mark first attendance" card is showing; one prompt at a time.
    !!firstStaffNudgeId ||
    !progress.startedAt || dayjs().diff(dayjs(progress.startedAt), 'day') >= SHOW_DAYS
  ) {
    return null;
  }

  const open = (item: Item) => {
    track('checklist_item_tapped', { item, done: progress[item] });
    if (item === 'payment') router.push(`/staff/${activeStaff[0].id}/add-payment`);
    else if (item === 'salary') router.push('/(tabs)/salary-due');
  };

  const dismiss = () => {
    track('checklist_dismissed', { done: doneCount });
    setHidden(true);
    setSetting(DISMISSED_KEY, '1');
  };

  const turnOnReminder = async () => {
    track('checklist_item_tapped', { item: 'reminder_on', done: false });
    await autoEnableReminder('checklist');
  };

  const reminderAt = dayjs(`2000-01-01T${reminderTime}`).format('h:mm A');
  const hint = (item: Item) =>
    item === 'tomorrow'
      ? (reminderEnabled ? i18n.t('checklist.tomorrow_on', { time: reminderAt }) : i18n.t('checklist.tomorrow_off'))
      : i18n.t(`checklist.${item}_hint`);

  return (
    <Card style={styles.card} mode="outlined">
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text variant="titleMedium" style={styles.title}>{i18n.t('checklist.title')}</Text>
            <Text variant="bodySmall" style={styles.secondary}>
              {i18n.t('checklist.progress', { done: doneCount, total: items.length })}
            </Text>
          </View>
          <IconButton icon="close" size={20} onPress={dismiss} accessibilityLabel={i18n.t('common.cancel')} />
        </View>
        {items.map((item) => {
          const done = progress[item];
          const tappable = !done && (item === 'payment' || item === 'salary');
          return (
            <Pressable key={item} onPress={tappable ? () => open(item) : undefined} style={styles.row}>
              <Icon
                source={done ? 'check-circle' : 'checkbox-blank-circle-outline'}
                size={22}
                color={done ? colors.present : colors.textSecondary}
              />
              <View style={styles.rowText}>
                <Text variant="bodyMedium" style={[styles.itemTitle, done && styles.itemDone]}>
                  {i18n.t(`checklist.${item}`)}
                </Text>
                {!done && <Text variant="bodySmall" style={styles.secondary}>{hint(item)}</Text>}
              </View>
              {item === 'tomorrow' && !done && !reminderEnabled ? (
                <Button mode="text" compact onPress={turnOnReminder}>{i18n.t('checklist.turn_on')}</Button>
              ) : tappable ? (
                <Icon source="chevron-right" size={22} color={colors.textSecondary} />
              ) : null}
            </Pressable>
          );
        })}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 12, marginTop: 10, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  headerText: { flex: 1 },
  title: { color: colors.text, fontWeight: 'bold' },
  secondary: { color: colors.textSecondary },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  rowText: { flex: 1 },
  itemTitle: { color: colors.text },
  itemDone: { color: colors.textSecondary, textDecorationLine: 'line-through' },
});
