/**
 * Lightweight local analytics tracking.
 *
 * Stores events in AsyncStorage. When you add a backend,
 * pipe these out via a sync job. No third-party SDK needed for MVP.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@textherbro_analytics';

// ─── Event Types ────────────────────────────────────────────────────────────

export type AnalyticsEvent =
  | 'app_open'
  | 'suggestion_copied'
  | 'suggestion_skipped'
  | 'activity_logged'
  | 'note_added'
  | 'streak_broken'
  | 'reminder_tapped'
  | 'paywall_shown'
  | 'paywall_converted';

export interface AnalyticsEntry {
  event: AnalyticsEvent;
  data?: Record<string, unknown>;
  timestamp: string;
}

// ─── Track Event ────────────────────────────────────────────────────────────

export async function trackEvent(
  event: AnalyticsEvent,
  data?: Record<string, unknown>,
): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const entries: AnalyticsEntry[] = raw ? JSON.parse(raw) : [];

    entries.unshift({
      event,
      data,
      timestamp: new Date().toISOString(),
    });

    // Keep last 500 events
    const trimmed = entries.slice(0, 500);
    await AsyncStorage.setItem(KEY, JSON.stringify(trimmed));
  } catch {
    // Analytics should never crash the app
  }
}

// ─── Read Events ────────────────────────────────────────────────────────────

export async function getAnalyticsEvents(): Promise<AnalyticsEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// ─── Summary ────────────────────────────────────────────────────────────────

export interface AnalyticsSummary {
  totalOpens: number;
  totalCopied: number;
  totalSkipped: number;
  totalActivities: number;
  totalNotesAdded: number;
  paywallShown: number;
  paywallConverted: number;
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const events = await getAnalyticsEvents();
  return {
    totalOpens: events.filter((e) => e.event === 'app_open').length,
    totalCopied: events.filter((e) => e.event === 'suggestion_copied').length,
    totalSkipped: events.filter((e) => e.event === 'suggestion_skipped').length,
    totalActivities: events.filter((e) => e.event === 'activity_logged').length,
    totalNotesAdded: events.filter((e) => e.event === 'note_added').length,
    paywallShown: events.filter((e) => e.event === 'paywall_shown').length,
    paywallConverted: events.filter((e) => e.event === 'paywall_converted').length,
  };
}
