// ─── Favorites (structured) ─────────────────────────────────────────────────

export interface Favorites {
  food?: string;
  flowers?: string;
  restaurant?: string;
  color?: string;
  brand?: string;
  music?: string;
  hobby?: string;
}

// ─── Partner ────────────────────────────────────────────────────────────────

export interface Partner {  id: string;  name: string;
  nickname?: string;
  birthday: string; // ISO date string
  anniversary: string; // ISO date string
  favorites: Favorites;
  /** Legacy free-text field kept for migration compat */
  favoriteThings?: string;
}

// ─── Activity Log ───────────────────────────────────────────────────────────

export interface ActivityLog {
  lastCompliment: string | null; // ISO date string
  lastDate: string | null;
  lastCheckIn: string | null;
  complimentStreak: number;
  checkInStreak: number;
  dateStreak: number;
  longestStreak: number; // Best-ever streak across all categories
}

// ─── Note Entry (Memory Bank) ───────────────────────────────────────────────

export type NoteCategory = 'gift' | 'date-idea' | 'she-said' | 'general';

export const NOTE_CATEGORIES: { key: NoteCategory; label: string; emoji: string }[] = [
  { key: 'general', label: 'General', emoji: '📝' },
  { key: 'she-said', label: 'She Said', emoji: '💬' },
  { key: 'date-idea', label: 'Date Idea', emoji: '🌹' },
  { key: 'gift', label: 'Gift Idea', emoji: '🎁' },
];

// ─── Saved Line (Playbook) ─────────────────────────────────────────────────────────

export interface SavedLine {
  id: string;
  text: string;
  category: 'compliment' | 'checkIn' | 'dateIdea' | 'deep' | 'sos';
  savedAt: string; // ISO date string
  timesUsed: number;
}

// ─── Milestone ───────────────────────────────────────────────────────────────

export type MilestoneType =
  | 'first_date'
  | 'official'
  | 'first_trip'
  | 'first_iloveyou'
  | 'moved_in'
  | 'engaged'
  | 'custom';

export interface Milestone {
  id: string;
  type: MilestoneType;
  label: string;
  date: string; // ISO date string
  note?: string;
}

export const MILESTONE_LABELS: Record<MilestoneType, { label: string; emoji: string }> = {
  first_date:     { label: 'First Date',       emoji: '🌹' },
  official:       { label: 'Made It Official', emoji: '💑' },
  first_trip:     { label: 'First Trip',        emoji: '✈️' },
  first_iloveyou: { label: 'First \'I Love You\'', emoji: '❤️' },
  moved_in:       { label: 'Moved In Together', emoji: '🏠' },
  engaged:        { label: 'Got Engaged',       emoji: '💍' },
  custom:         { label: 'Custom',            emoji: '⭐' },
};

// ─── Note Entry (Memory Bank) ─────────────────────────────────────────────────────────

export interface NoteEntry {
  id: string;
  text: string;
  category: NoteCategory;
  createdAt: string; // ISO date string
}

// ─── Activity History ────────────────────────────────────────────────────────

export type ActivityType = 'compliment' | 'checkIn' | 'date';

export interface ActivityHistoryEntry {
  id: string;
  type: ActivityType;
  timestamp: string; // ISO date string
}

// ─── Settings ───────────────────────────────────────────────────────────────

export interface AppSettings {
  remindersEnabled: boolean;
  /** Hour (0-23) for the daily reminder. Default 18 (6pm). */
  reminderHour: number;
  /** Minute (0-59) for the daily reminder. Default 0. */
  reminderMinute: number;
}

// ─── Defaults ───────────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS: AppSettings = {
  remindersEnabled: true,
  reminderHour: 18,
  reminderMinute: 0,
};

export const DEFAULT_ACTIVITY_LOG: ActivityLog = {
  lastCompliment: null,
  lastDate: null,
  lastCheckIn: null,
  complimentStreak: 0,
  checkInStreak: 0,
  dateStreak: 0,
  longestStreak: 0,
};
