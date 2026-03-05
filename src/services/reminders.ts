import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { getPartner, getActivityLog } from './storage';
import { isSameDay, isWithinDays, daysSince } from '../utils/date';

// ─── Setup ──────────────────────────────────────────────────────────────────

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  return 'granted';
}

// ─── Scheduled Reminders ────────────────────────────────────────────────────

const REMINDER_MESSAGES = {
  checkIn: [
    "Bro… ask her how her day went. 💬",
    "Quick check-in goes a long way, king. 👑",
    "She's thinking about you. Text her back.",
  ],
  compliment: [
    "Compliment streak about to break. 🔥",
    "Tell her she looks good today. Trust me.",
    "One compliment. That's all it takes, bro.",
  ],
  birthday: [
    "Her birthday is coming up. Don't blow this. 🎂",
  ],
  anniversary: [
    "Anniversary alert! Plan something, king. 💍",
  ],
  fumbleWarning: [
    "Bro… you haven't texted her today. Don't fumble. ⚠️",
    "It's been a while. She's noticing. Text her.",
    "Fumble risk rising. One text can fix this. 📱",
  ],
  fumbleUrgent: [
    "🚨 You're about to fumble bro. She hasn't heard from you.",
    "Fumble risk: HIGH. Text her RIGHT NOW.",
    "Day's almost over and you haven't reached out. Don't blow it. 💀",
  ],
};

function randomMessage(
  type: keyof typeof REMINDER_MESSAGES,
): string {
  const msgs = REMINDER_MESSAGES[type];
  return msgs[Math.floor(Math.random() * msgs.length)];
}

/**
 * Calculates hours since the most recent activity of any type.
 */
function hoursSinceLastActivity(log: { lastCompliment: string | null; lastCheckIn: string | null; lastDate: string | null }): number {
  const timestamps = [log.lastCompliment, log.lastCheckIn, log.lastDate].filter(Boolean) as string[];
  if (timestamps.length === 0) return Infinity;
  const latest = Math.max(...timestamps.map(t => new Date(t).getTime()));
  return (Date.now() - latest) / (1000 * 60 * 60);
}

export async function scheduleReminders(): Promise<void> {
  // Cancel existing before re-scheduling
  await Notifications.cancelAllScheduledNotificationsAsync();

  const log = await getActivityLog();
  const now = new Date().toISOString();

  // ── Fumble Escalation System ──
  // 12h warning, 18h increased urgency, 24h critical
  const hoursSince = hoursSinceLastActivity(log);

  if (hoursSince < 12) {
    // Schedule a 12-hour warning from last activity
    const triggerMs = (12 - hoursSince) * 60 * 60 * 1000;
    if (triggerMs > 0) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Text Her Bro',
          body: randomMessage('fumbleWarning'),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: Math.max(60, Math.round(triggerMs / 1000)),
        },
      });
    }
  } else if (hoursSince < 18) {
    // Already past 12h — schedule 18h warning
    const triggerMs = (18 - hoursSince) * 60 * 60 * 1000;
    if (triggerMs > 0) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⚠️ Fumble Alert',
          body: randomMessage('fumbleWarning'),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: Math.max(60, Math.round(triggerMs / 1000)),
        },
      });
    }
  } else if (hoursSince < 24) {
    // Past 18h — schedule urgent 24h alert
    const triggerMs = (24 - hoursSince) * 60 * 60 * 1000;
    if (triggerMs > 0) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🚨 FUMBLE INCOMING',
          body: randomMessage('fumbleUrgent'),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: Math.max(60, Math.round(triggerMs / 1000)),
        },
      });
    }
  } else {
    // Past 24h — send an immediate nudge + daily fallback
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🚨 FUMBLE INCOMING',
        body: randomMessage('fumbleUrgent'),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 60, // ~1 minute from now
      },
    });
  }

  // ── Daily Check-in Reminder — only if no check-in today ──
  const didCheckInToday = log.lastCheckIn && isSameDay(log.lastCheckIn, now);
  if (!didCheckInToday) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Text Her Bro',
        body: randomMessage('checkIn'),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 18,
        minute: 0,
      },
    });
  }

  // ── Compliment reminder — only if no compliment in 2+ days ──
  const needsCompliment = !log.lastCompliment || !isWithinDays(log.lastCompliment, 2);
  if (needsCompliment) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Text Her Bro',
        body: randomMessage('compliment'),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 12,
        minute: 0,
      },
    });
  }

  // Birthday & Anniversary — schedule 3 days before if partner exists
  const partner = await getPartner();
  if (partner) {
    await scheduleDateReminder(partner.birthday, 'birthday');
    await scheduleDateReminder(partner.anniversary, 'anniversary');
  }
}

async function scheduleDateReminder(
  dateStr: string,
  type: 'birthday' | 'anniversary',
): Promise<void> {
  if (!dateStr) return;

  const now = new Date();
  const date = new Date(dateStr);
  // Set to this year
  date.setFullYear(now.getFullYear());

  // If date already passed this year, set to next year
  if (date.getTime() < now.getTime()) {
    date.setFullYear(now.getFullYear() + 1);
  }

  // Remind 3 days before
  const reminderDate = new Date(date.getTime() - 3 * 24 * 60 * 60 * 1000);
  if (reminderDate.getTime() <= now.getTime()) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Text Her Bro',
      body: randomMessage(type),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: reminderDate,
    },
  });
}

export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
