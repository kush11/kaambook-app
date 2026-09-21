import i18n from '../i18n';

export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const Notifications = await import('expo-notifications');
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function scheduleAttendanceReminder(hour: number, minute: number): Promise<void> {
  try {
    const Notifications = await import('expo-notifications');

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    await cancelAttendanceReminder();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: i18n.t('settings.reminder_notif_title'),
        body: i18n.t('settings.reminder_notif_body'),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  } catch {
    // Notifications not available (e.g. Expo Go)
  }
}

export async function cancelAttendanceReminder(): Promise<void> {
  try {
    const Notifications = await import('expo-notifications');
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // Notifications not available
  }
}
