/**
 * Premium status management and free-tier gate checks.
 *
 * All limits are enforced here so screens just call `canX()`.
 * Refresh counts reset daily via day-key comparison.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { FREE_LIMITS } from '../config/premiumFeatures';

const KEYS = {
  PREMIUM_STATUS: '@textherbro_premium',
  REFRESH_COUNTS: '@textherbro_refresh_counts',
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
