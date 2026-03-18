/**
 * Engagement service — review prompts and proactive paywall triggers.
 *
 * Review logic (Apple guideline: max 3 prompts per 365 days):
 *   - Prompt after a 3-day compliment or check-in streak
 *   - Only if at least 2 days have passed since last prompt
 *   - Never prompts on first launch
 *
 * Proactive paywall logic:
 *   - Show "you're on a roll" paywall once when compliment streak hits 3+
 *   - Never show again once dismissed or purchased
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';

const KEYS = {
  LAST_REVIEW_PROMPT: '@textherbro_last_review_prompt',
  STREAK_PAYWALL_SHOWN: '@textherbro_streak_paywall_shown',
};

const MIN_DAYS_BETWEEN_REVIEWS = 60; // be conservative

// ─── Review Prompt ───────────────────────────────────────────────────────────

/**
 * Call this after a streak milestone (e.g. 3-day streak hit).
 * Will silently no-op if conditions aren't right.
 */
export async function maybeRequestReview(): Promise<void> {
  try {
    const isAvailable = await StoreReview.isAvailableAsync();
    if (!isAvailable) return;

    const lastRaw = await AsyncStorage.getItem(KEYS.LAST_REVIEW_PROMPT);
    if (lastRaw) {
      const daysSinceLast = (Date.now() - parseInt(lastRaw, 10)) / (1000 * 60 * 60 * 24);
      if (daysSinceLast < MIN_DAYS_BETWEEN_REVIEWS) return;
    }

    await StoreReview.requestReview();
    await AsyncStorage.setItem(KEYS.LAST_REVIEW_PROMPT, Date.now().toString());
  } catch {
    // Silently ignore — review prompts must never crash the app
  }
}

// ─── Streak Paywall ──────────────────────────────────────────────────────────

/**
 * Returns true if the proactive "you're on a roll" paywall should be shown.
 * Only fires once ever (until they convert or we reset).
 */
export async function shouldShowStreakPaywall(complimentStreak: number): Promise<boolean> {
  if (complimentStreak < 3) return false;
  const shown = await AsyncStorage.getItem(KEYS.STREAK_PAYWALL_SHOWN);
  return shown !== 'true';
}

export async function markStreakPaywallShown(): Promise<void> {
  await AsyncStorage.setItem(KEYS.STREAK_PAYWALL_SHOWN, 'true');
}
