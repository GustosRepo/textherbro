/**
 * Milestone badge system.
 *
 * Badges are awarded automatically when conditions are met.
 * Once awarded, they persist in AsyncStorage forever.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityLog, ActivityHistoryEntry } from '../types/partner';

const KEY = '@textherbro_badges';

// ─── Badge Definitions ──────────────────────────────────────────────────────

export interface BadgeDefinition {
  id: string;
  label: string;
  description: string;
  emoji: string;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'streak_7',
    label: '7-Day King',
    description: 'Maintained a 7-day streak',
    emoji: '👑',
  },
  {
    id: 'streak_30',
    label: '30-Day Legend',
    description: 'Maintained a 30-day streak',
    emoji: '🏆',
  },
  {
    id: 'smooth_talker',
    label: 'Smooth Talker',
    description: 'Sent 50 compliments',
    emoji: '😎',
  },
  {
    id: 'notes_10',
    label: 'Memory Master',
    description: 'Added 10+ notes to Memory Bank',
    emoji: '🧠',
  },
  {
    id: 'date_hero',
    label: 'Date Night Hero',
    description: 'Logged 10 date nights',
    emoji: '🌹',
  },
  {
    id: 'apology_champ',
    label: 'Apology Champ',
    description: 'Used 5 apology templates',
    emoji: '🕊️',
  },
  {
    id: 'no_fumbles',
    label: 'No Fumbles',
    description: '14-day streak with zero fumble alerts',
    emoji: '🛡️',
  },
];

// ─── Awarded Badges ─────────────────────────────────────────────────────────

export interface AwardedBadge {
  id: string;
  awardedAt: string; // ISO date string
}

export async function getAwardedBadges(): Promise<AwardedBadge[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

async function saveBadges(badges: AwardedBadge[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(badges));
}

// ─── Check & Award ──────────────────────────────────────────────────────────

/**
 * Evaluate badge conditions and award any newly earned badges.
 * Returns the full list of awarded badges (old + new).
 */
export async function checkAndAwardBadges(
  log: ActivityLog,
  noteCount: number,
  history: ActivityHistoryEntry[],
): Promise<AwardedBadge[]> {
  const awarded = await getAwardedBadges();
  const awardedIds = new Set(awarded.map((b) => b.id));
  const newBadges: AwardedBadge[] = [];

  const bestStreak = Math.max(
    log.complimentStreak,
    log.checkInStreak,
    log.dateStreak,
  );

  // 7-day streak
  if (!awardedIds.has('streak_7') && bestStreak >= 7) {
    newBadges.push({ id: 'streak_7', awardedAt: new Date().toISOString() });
  }

  // 30-day streak
  if (!awardedIds.has('streak_30') && bestStreak >= 30) {
    newBadges.push({ id: 'streak_30', awardedAt: new Date().toISOString() });
  }

  // 50 compliments (Smooth Talker)
  const totalCompliments = history.filter((h) => h.type === 'compliment').length;
  if (!awardedIds.has('smooth_talker') && totalCompliments >= 50) {
    newBadges.push({ id: 'smooth_talker', awardedAt: new Date().toISOString() });
  }

  // 10 notes (Memory Master)
  if (!awardedIds.has('notes_10') && noteCount >= 10) {
    newBadges.push({ id: 'notes_10', awardedAt: new Date().toISOString() });
  }

  // 10 date nights (Date Night Hero)
  const totalDates = history.filter((h) => h.type === 'date').length;
  if (!awardedIds.has('date_hero') && totalDates >= 10) {
    newBadges.push({ id: 'date_hero', awardedAt: new Date().toISOString() });
  }

  // Apology Champ — tracked via analytics or a proxy. For now: 5 check-in + compliment same day combos
  // We approximate with: at least 5 days where both compliment and checkIn happened
  const dayMap = new Map<string, Set<string>>();
  for (const h of history) {
    const day = h.timestamp.slice(0, 10);
    if (!dayMap.has(day)) dayMap.set(day, new Set());
    dayMap.get(day)!.add(h.type);
  }
  const fullDays = [...dayMap.values()].filter(s => s.has('compliment') && s.has('checkIn')).length;
  if (!awardedIds.has('apology_champ') && fullDays >= 5) {
    newBadges.push({ id: 'apology_champ', awardedAt: new Date().toISOString() });
  }

  // No Fumbles — 14-day streak on BOTH compliment and checkIn
  if (!awardedIds.has('no_fumbles') && log.complimentStreak >= 14 && log.checkInStreak >= 14) {
    newBadges.push({ id: 'no_fumbles', awardedAt: new Date().toISOString() });
  }

  if (newBadges.length > 0) {
    const updated = [...awarded, ...newBadges];
    await saveBadges(updated);
    return updated;
  }

  return awarded;
}
