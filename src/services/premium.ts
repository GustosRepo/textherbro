/**
 * Premium status management and free-tier gate checks.
 *
 * All limits are enforced here so screens just call `canX()`.
 * Refresh counts reset daily via day-key comparison.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { FREE_LIMITS } from '../config/premiumFeatures';
import type { PackId } from '../config/templatePacks';
import { getActivityLog, saveActivityLog } from './storage';

const KEYS = {
  PREMIUM_STATUS: '@textherbro_premium',
  REFRESH_COUNTS: '@textherbro_refresh_counts',
  SELECTED_TONE: '@textherbro_selected_tone',
  SHIELD_DATA: '@textherbro_shields',
};

// ─── Refresh Count Tracking ─────────────────────────────────────────────────

export type RefreshCategory = 'compliment' | 'checkIn' | 'dateIdea';

interface RefreshCounts {
  day: string; // YYYY-MM-DD
  compliment: number;
  checkIn: number;
  dateIdea: number;
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function getRefreshCounts(): Promise<RefreshCounts> {
  const raw = await AsyncStorage.getItem(KEYS.REFRESH_COUNTS);
  if (!raw) return { day: todayKey(), compliment: 0, checkIn: 0, dateIdea: 0 };
  const parsed = JSON.parse(raw) as RefreshCounts;
  // Auto-reset on new day
  if (parsed.day !== todayKey()) {
    return { day: todayKey(), compliment: 0, checkIn: 0, dateIdea: 0 };
  }
  return parsed;
}

async function saveRefreshCounts(counts: RefreshCounts): Promise<void> {
  await AsyncStorage.setItem(KEYS.REFRESH_COUNTS, JSON.stringify(counts));
}

// ─── Premium Status ─────────────────────────────────────────────────────────

export async function isPremium(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(KEYS.PREMIUM_STATUS);
  return raw === 'true';
}

export async function setPremiumStatus(status: boolean): Promise<void> {
  await AsyncStorage.setItem(KEYS.PREMIUM_STATUS, status ? 'true' : 'false');
}

// ─── Gate Checks ────────────────────────────────────────────────────────────

/** Can the user add another note? Free users capped at 10. */
export async function canAddNote(currentCount: number): Promise<boolean> {
  if (await isPremium()) return true;
  return currentCount < FREE_LIMITS.maxNotes;
}

/** Can the user press "Another" for this category today? Free: 3 per category. */
export async function canRefreshSuggestion(category: RefreshCategory): Promise<boolean> {
  if (await isPremium()) return true;
  const counts = await getRefreshCounts();
  return counts[category] < FREE_LIMITS.maxRefreshesPerCategory;
}

/** Increment the daily refresh count for a category. */
export async function incrementRefreshCount(category: RefreshCategory): Promise<void> {
  const counts = await getRefreshCounts();
  counts[category] += 1;
  await saveRefreshCounts(counts);
}

/** How many refreshes left today for this category? */
export async function getRemainingRefreshes(category: RefreshCategory): Promise<number> {
  if (await isPremium()) return Infinity;
  const counts = await getRefreshCounts();
  return Math.max(0, FREE_LIMITS.maxRefreshesPerCategory - counts[category]);
}

// ─── Tone / Pack Selection ───────────────────────────────────────────────────

export async function getSelectedTone(): Promise<PackId> {
  const raw = await AsyncStorage.getItem(KEYS.SELECTED_TONE);
  return (raw as PackId) ?? 'free';
}

export async function setSelectedTone(packId: PackId): Promise<void> {
  await AsyncStorage.setItem(KEYS.SELECTED_TONE, packId);
}

// ─── Streak Shields ─────────────────────────────────────────────────────────

interface ShieldData {
  count: number;
  lastRefillWeek: string; // "YYYY-Wnn"
}

function getISOWeekKey(): string {
  const d = new Date();
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

async function getShieldData(): Promise<ShieldData> {
  const raw = await AsyncStorage.getItem(KEYS.SHIELD_DATA);
  const currentWeek = getISOWeekKey();
  if (!raw) return { count: 1, lastRefillWeek: currentWeek };
  const data = JSON.parse(raw) as ShieldData;
  if (data.lastRefillWeek !== currentWeek) {
    // New week — refill to 1
    return { count: 1, lastRefillWeek: currentWeek };
  }
  return data;
}

export async function getShieldCount(): Promise<number> {
  if (!(await isPremium())) return 0;
  const data = await getShieldData();
  return data.count;
}

export async function canUseShield(): Promise<boolean> {
  if (!(await isPremium())) return false;
  const data = await getShieldData();
  return data.count > 0;
}

/** Patch the given activity's timestamp to yesterday, preventing streak reset. */
export async function applyShieldToStreak(
  type: 'compliment' | 'checkIn' | 'date',
): Promise<void> {
  if (!(await canUseShield())) return;

  const log = await getActivityLog();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayISO = yesterday.toISOString();

  if (type === 'compliment') log.lastCompliment = yesterdayISO;
  else if (type === 'checkIn') log.lastCheckIn = yesterdayISO;
  else log.lastDate = yesterdayISO;

  await saveActivityLog(log);

  // Consume the shield
  const data = await getShieldData();
  await AsyncStorage.setItem(
    KEYS.SHIELD_DATA,
    JSON.stringify({ count: Math.max(0, data.count - 1), lastRefillWeek: data.lastRefillWeek }),
  );
}
