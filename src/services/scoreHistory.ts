/**
 * Daily score snapshots for trend tracking.
 *
 * Stores one score per day, keeps last 90 days.
 * Later powers a score trend graph (premium feature).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@textherbro_score_history';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ScoreSnapshot {
  date: string; // YYYY-MM-DD
  score: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ─── Record ─────────────────────────────────────────────────────────────────

export async function recordDailyScore(score: number): Promise<void> {
  const history = await getScoreHistory();
  const today = todayKey();

  const existing = history.findIndex((s) => s.date === today);
  if (existing >= 0) {
    history[existing].score = score;
  } else {
    history.push({ date: today, score });
  }

  // Keep last 90 days
  const trimmed = history.slice(-90);
  await AsyncStorage.setItem(KEY, JSON.stringify(trimmed));
}

// ─── Read ───────────────────────────────────────────────────────────────────

export async function getScoreHistory(): Promise<ScoreSnapshot[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

// ─── Trend ──────────────────────────────────────────────────────────────────

export interface ScoreTrend {
  current: number;
  previous: number;
  change: number;
  direction: 'up' | 'down' | 'flat';
}

export async function getScoreTrend(): Promise<ScoreTrend> {
  const history = await getScoreHistory();

  if (history.length < 2) {
    const current = history.length > 0 ? history[history.length - 1].score : 50;
    return { current, previous: current, change: 0, direction: 'flat' };
  }

  const current = history[history.length - 1].score;
  // Compare to 7 days ago or the oldest entry
  const weekAgoIdx = Math.max(0, history.length - 7);
  const previous = history[weekAgoIdx].score;
  const change = current - previous;

  return {
    current,
    previous,
    change,
    direction: change > 0 ? 'up' : change < 0 ? 'down' : 'flat',
  };
}
