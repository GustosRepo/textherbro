/**
 * Widget sync service.
 *
 * Reads the current partner/score data from AsyncStorage and writes it
 * to the shared App Group UserDefaults via the WidgetBridge native module.
 * The iOS home-screen widget extension reads from that same container.
 *
 * Call syncWidget() whenever the app loads or the user takes an action
 * (already wired into HomeScreen.loadData).
 *
 * On Android (no widget support) and simulator (no WidgetKit) this is a no-op.
 */

import { NativeModules, Platform } from 'react-native';
import { getActivityLog, getPartner, calculateScore, getNoteEntries } from './storage';
import { daysSince } from '../utils/date';

const { WidgetBridge } = NativeModules;

/** Clamp days-since to 99 so the native side treats 99 as "never". */
function clampDays(raw: number): number {
  return isFinite(raw) ? Math.min(Math.round(raw), 99) : 99;
}

export async function syncWidget(): Promise<void> {
  // Guard: only runs on iOS with the native module linked.
  if (Platform.OS !== 'ios' || !WidgetBridge?.syncWidgetData) return;

  try {
    const [partner, log, notes] = await Promise.all([
      getPartner(),
      getActivityLog(),
      getNoteEntries(),
    ]);

    if (!partner) return;

    const score = calculateScore(log, notes.length);

    WidgetBridge.syncWidgetData({
      partnerName: partner.nickname || partner.name,
      score,
      daysSinceCompliment: clampDays(daysSince(log.lastCompliment)),
      daysSinceCheckIn:    clampDays(daysSince(log.lastCheckIn)),
      daysSinceDate:       clampDays(daysSince(log.lastDate)),
      complimentStreak:    log.complimentStreak,
    });
  } catch (e) {
    // Never crash the app because of a widget sync failure.
    console.warn('[widget] syncWidget failed:', e);
  }
}
