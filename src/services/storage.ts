import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Partner,
  ActivityLog,
  NoteEntry,
  NoteCategory,
  AppSettings,
  ActivityHistoryEntry,
  Milestone,
  SavedLine,
  DEFAULT_ACTIVITY_LOG,
  DEFAULT_SETTINGS,
} from '../types/partner';
import { isWithinDays, isSameDay, isConsecutiveDay, daysSince } from '../utils/date';

const KEYS = {
  // Legacy single-partner keys (kept for migration)
  PARTNER: '@textherbro_partner',
  ACTIVITY_LOG: '@textherbro_activity_log',
  NOTES: '@textherbro_notes_v2',
  HISTORY: '@textherbro_history',
  // Multi-partner keys
  ALL_PARTNERS: '@textherbro_all_partners',
  ACTIVE_PARTNER_ID: '@textherbro_active_partner_id',
  // Global keys
  SETTINGS: '@textherbro_settings',
  SAVED_LINES: '@textherbro_saved_lines',
  MILESTONES: '@textherbro_milestones',
};

/** Generate a simple unique ID */
function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/** Per-partner key prefix */
function pk(base: string, partnerId: string): string {
  return `${base}_${partnerId}`;
}

// ─── Multi-Partner Management ────────────────────────────────────────────────

export async function getAllPartners(): Promise<Partner[]> {
  const raw = await AsyncStorage.getItem(KEYS.ALL_PARTNERS);
  return raw ? JSON.parse(raw) : [];
}

export async function saveAllPartners(partners: Partner[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.ALL_PARTNERS, JSON.stringify(partners));
}

export async function getActivePartnerId(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.ACTIVE_PARTNER_ID);
}

export async function setActivePartnerId(id: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.ACTIVE_PARTNER_ID, id);
}

export async function addPartner(partner: Omit<Partner, 'id'>): Promise<Partner> {
  const all = await getAllPartners();
  const newPartner: Partner = { ...partner, id: genId() };
  await saveAllPartners([...all, newPartner]);
  if (all.length === 0) await setActivePartnerId(newPartner.id);
  return newPartner;
}

export async function deletePartner(id: string): Promise<void> {
  const all = await getAllPartners();
  const updated = all.filter((p) => p.id !== id);
  await saveAllPartners(updated);
  const activeId = await getActivePartnerId();
  if (activeId === id && updated.length > 0) {
    await setActivePartnerId(updated[0].id);
  }
  // Clean up per-partner data
  await AsyncStorage.multiRemove([
    pk(KEYS.ACTIVITY_LOG, id),
    pk(KEYS.NOTES, id),
    pk(KEYS.HISTORY, id),
  ]);
}

// ─── Partner (active) ────────────────────────────────────────────────────────

export async function getPartner(): Promise<Partner | null> {
  let partners = await getAllPartners();

  // Migration: lift legacy single-partner into multi-partner store
  if (partners.length === 0) {
    const raw = await AsyncStorage.getItem(KEYS.PARTNER);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed.favorites) parsed.favorites = {};
    if (!parsed.id) parsed.id = genId();
    await saveAllPartners([parsed]);
    await setActivePartnerId(parsed.id);

    // Migrate per-partner data to keyed stores
    const [logRaw, notesRaw, histRaw] = await Promise.all([
      AsyncStorage.getItem(KEYS.ACTIVITY_LOG),
      AsyncStorage.getItem(KEYS.NOTES),
      AsyncStorage.getItem(KEYS.HISTORY),
    ]);
    if (logRaw)   await AsyncStorage.setItem(pk(KEYS.ACTIVITY_LOG, parsed.id), logRaw);
    if (notesRaw) await AsyncStorage.setItem(pk(KEYS.NOTES, parsed.id), notesRaw);
    if (histRaw)  await AsyncStorage.setItem(pk(KEYS.HISTORY, parsed.id), histRaw);

    return parsed as Partner;
  }

  const activeId = await getActivePartnerId();
  return partners.find((p) => p.id === activeId) ?? partners[0];
}

export async function savePartner(partner: Partner): Promise<void> {
  const all = await getAllPartners();
  let found = false;
  const updated = all.map((p) => {
    if (p.id === partner.id) { found = true; return partner; }
    return p;
  });
  if (!found) updated.push(partner);
  await saveAllPartners(updated);
  await setActivePartnerId(partner.id);
}

// ─── Activity Log ─────────────────────────────────────────────────────────────

async function activePartnerKey(base: string): Promise<string> {
  const id = await getActivePartnerId();
  return id ? pk(base, id) : base;
}

export async function getActivityLog(): Promise<ActivityLog> {
  const key = await activePartnerKey(KEYS.ACTIVITY_LOG);
  const raw = await AsyncStorage.getItem(key);
  return raw ? (JSON.parse(raw) as ActivityLog) : { ...DEFAULT_ACTIVITY_LOG };
}

export async function saveActivityLog(log: ActivityLog): Promise<void> {
  const key = await activePartnerKey(KEYS.ACTIVITY_LOG);
  await AsyncStorage.setItem(key, JSON.stringify(log));
}

/**
 * Log an activity type. Updates timestamp + streak.
 *
 * Streak logic:
 * - Compliment / check-in: consecutive-day streak (resets if gap > 1 day)
 * - Date: increments if last date was within 14 days, else resets
 *
 * If already logged today, no-op for streak (still updates timestamp).
 */
export async function logActivity(
  type: 'compliment' | 'checkIn' | 'date',
): Promise<ActivityLog> {
  const log = await getActivityLog();
  const now = new Date().toISOString();

  switch (type) {
    case 'compliment': {
      if (log.lastCompliment && isSameDay(log.lastCompliment, now)) {
        // Already logged today — just bump timestamp
        log.lastCompliment = now;
      } else if (log.lastCompliment && isConsecutiveDay(log.lastCompliment, now)) {
        log.complimentStreak += 1;
        log.lastCompliment = now;
      } else {
        log.complimentStreak = 1;
        log.lastCompliment = now;
      }
      break;
    }
    case 'checkIn': {
      if (log.lastCheckIn && isSameDay(log.lastCheckIn, now)) {
        log.lastCheckIn = now;
      } else if (log.lastCheckIn && isConsecutiveDay(log.lastCheckIn, now)) {
        log.checkInStreak += 1;
        log.lastCheckIn = now;
      } else {
        log.checkInStreak = 1;
        log.lastCheckIn = now;
      }
      break;
    }
    case 'date': {
      if (log.lastDate && isSameDay(log.lastDate, now)) {
        log.lastDate = now;
      } else {
        const wasRecent = isWithinDays(log.lastDate, 14);
        log.dateStreak = wasRecent ? log.dateStreak + 1 : 1;
        log.lastDate = now;
      }
      break;
    }
  }

  // Track longest streak ever
  const currentBest = Math.max(log.complimentStreak, log.checkInStreak, log.dateStreak);
  if (!log.longestStreak || currentBest > log.longestStreak) {
    log.longestStreak = currentBest;
  }

  await saveActivityLog(log);

  // Record to history timeline
  await addHistoryEntry(type);

  return log;
}

// ─── Notes (Memory Bank) ────────────────────────────────────────────────────

export async function getNoteEntries(): Promise<NoteEntry[]> {
  const key = await activePartnerKey(KEYS.NOTES);
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return [];
  const parsed = JSON.parse(raw) as NoteEntry[];
  return parsed.map((n) => ({ ...n, category: n.category ?? 'general' }));
}

export async function saveNoteEntries(notes: NoteEntry[]): Promise<void> {
  const key = await activePartnerKey(KEYS.NOTES);
  await AsyncStorage.setItem(key, JSON.stringify(notes));
}

export async function addNoteEntry(
  text: string,
  category: NoteCategory = 'general',
): Promise<NoteEntry[]> {
  const notes = await getNoteEntries();
  const entry: NoteEntry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    text,
    category,
    createdAt: new Date().toISOString(),
  };
  const updated = [entry, ...notes];
  await saveNoteEntries(updated);
  return updated;
}

export async function deleteNoteEntry(id: string): Promise<NoteEntry[]> {
  const notes = await getNoteEntries();
  const updated = notes.filter((n) => n.id !== id);
  await saveNoteEntries(updated);
  return updated;
}

// ─── Activity History ───────────────────────────────────────────────────────

export async function getHistory(): Promise<ActivityHistoryEntry[]> {
  const key = await activePartnerKey(KEYS.HISTORY);
  const raw = await AsyncStorage.getItem(key);
  return raw ? (JSON.parse(raw) as ActivityHistoryEntry[]) : [];
}

async function addHistoryEntry(type: 'compliment' | 'checkIn' | 'date'): Promise<void> {
  const key = await activePartnerKey(KEYS.HISTORY);
  const history = await getHistory();
  const entry: ActivityHistoryEntry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    type,
    timestamp: new Date().toISOString(),
  };
  const updated = [entry, ...history].slice(0, 100);
  await AsyncStorage.setItem(key, JSON.stringify(updated));
}

// ─── Saved Lines (Playbook) ───────────────────────────────────────────────────────────

export async function getSavedLines(): Promise<SavedLine[]> {
  const raw = await AsyncStorage.getItem(KEYS.SAVED_LINES);
  return raw ? JSON.parse(raw) : [];
}

export async function saveLine(text: string, category: SavedLine['category']): Promise<SavedLine[]> {
  const lines = await getSavedLines();
  const entry: SavedLine = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    text,
    category,
    savedAt: new Date().toISOString(),
    timesUsed: 0,
  };
  const updated = [entry, ...lines];
  await AsyncStorage.setItem(KEYS.SAVED_LINES, JSON.stringify(updated));
  return updated;
}

export async function deleteSavedLine(id: string): Promise<SavedLine[]> {
  const lines = await getSavedLines();
  const updated = lines.filter((l) => l.id !== id);
  await AsyncStorage.setItem(KEYS.SAVED_LINES, JSON.stringify(updated));
  return updated;
}

export async function incrementLineUsage(id: string): Promise<void> {
  const lines = await getSavedLines();
  const updated = lines.map((l) => l.id === id ? { ...l, timesUsed: l.timesUsed + 1 } : l);
  await AsyncStorage.setItem(KEYS.SAVED_LINES, JSON.stringify(updated));
}

// ─── Milestones ───────────────────────────────────────────────────────────────

export async function getMilestones(): Promise<Milestone[]> {
  const raw = await AsyncStorage.getItem(KEYS.MILESTONES);
  const all: Milestone[] = raw ? JSON.parse(raw) : [];
  return all.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function addMilestone(milestone: Omit<Milestone, 'id'>): Promise<Milestone[]> {
  const all = await getMilestones();
  const entry: Milestone = { ...milestone, id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6) };
  const updated = [...all, entry];
  await AsyncStorage.setItem(KEYS.MILESTONES, JSON.stringify(updated));
  return updated.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function deleteMilestone(id: string): Promise<Milestone[]> {
  const all = await getMilestones();
  const updated = all.filter((m) => m.id !== id);
  await AsyncStorage.setItem(KEYS.MILESTONES, JSON.stringify(updated));
  return updated;
}

// ─── Settings ───────────────────────────────────────────────────────────────

export async function getSettings(): Promise<AppSettings> {
  const raw = await AsyncStorage.getItem(KEYS.SETTINGS);
  if (!raw) return { ...DEFAULT_SETTINGS };
  const parsed = JSON.parse(raw) as Partial<AppSettings>;
  // Migration: fill in any missing fields with defaults
  return { ...DEFAULT_SETTINGS, ...parsed };
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
}

// ─── Score Calculation ──────────────────────────────────────────────────────

/**
 * Score starts at 50. You EARN your way up.
 *
 * Recency (max +40):
 *   Compliment: today +15 | 1d +10 | 2d +5 | 3d+ 0 | never −10
 *   Check-in:   today +15 | 1d +10 | 2d +5 | 3d+ 0 | never −10
 *   Date:       ≤7d +10 | ≤14d +5 | 14d+ 0 | never −10
 *
 * Streaks (max +17):
 *   Best of compliment/check-in streak: 30d +12 | 14d +8 | 7d +5
 *   Date streak ≥3: +5
 *
 * Memory Bank (max +8):
 *   10+ notes +8 | 5+ notes +5 | 1+ notes +3
 *
 * Range: 20 (never done anything) → 100 (capped)
 */
export function calculateScore(log: ActivityLog, noteCount: number = 0): number {
  let score = 50;

  // ── Compliment recency (max +15) ──
  const compDays = daysSince(log.lastCompliment);
  if (compDays === 0) score += 15;
  else if (compDays === 1) score += 10;
  else if (compDays <= 2) score += 5;
  else if (compDays === Infinity) score -= 10;

  // ── Check-in recency (max +15) ──
  const checkDays = daysSince(log.lastCheckIn);
  if (checkDays === 0) score += 15;
  else if (checkDays === 1) score += 10;
  else if (checkDays <= 2) score += 5;
  else if (checkDays === Infinity) score -= 10;

  // ── Date recency (max +10) ──
  const dateDays = daysSince(log.lastDate);
  if (dateDays <= 7) score += 10;
  else if (dateDays <= 14) score += 5;
  else if (dateDays === Infinity) score -= 10;

  // ── Streak bonuses (max +17) ──
  const bestStreak = Math.max(log.complimentStreak, log.checkInStreak);
  if (bestStreak >= 30) score += 12;
  else if (bestStreak >= 14) score += 8;
  else if (bestStreak >= 7) score += 5;
  if (log.dateStreak >= 3) score += 5;

  // ── Memory Bank bonus (max +8) ──
  if (noteCount >= 10) score += 8;
  else if (noteCount >= 5) score += 5;
  else if (noteCount >= 1) score += 3;

  return Math.max(0, Math.min(100, score));
}

// ─── Fumble Alerts ──────────────────────────────────────────────────────────

export interface FumbleAlert {
  emoji: string;
  message: string;
}

export function getFumbleAlerts(log: ActivityLog): FumbleAlert[] {
  const alerts: FumbleAlert[] = [];

  if (!log.lastCompliment || !isWithinDays(log.lastCompliment, 3)) {
    const label = log.lastCompliment ? '4+ days' : 'forever';
    alerts.push({ emoji: '⚠️', message: `No compliment in ${label}` });
  }
  if (!log.lastCheckIn || !isWithinDays(log.lastCheckIn, 2)) {
    const label = log.lastCheckIn ? '2+ days' : 'forever';
    alerts.push({ emoji: '⚠️', message: `No check-in in ${label}` });
  }
  if (!log.lastDate || !isWithinDays(log.lastDate, 14)) {
    const label = log.lastDate ? '14+ days' : 'forever';
    alerts.push({ emoji: '⚠️', message: `No date in ${label}` });
  }

  return alerts;
}
