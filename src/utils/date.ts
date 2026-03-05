/**
 * Date utilities for the Text Her Bro app.
 * All dates are ISO strings or Date objects.
 */

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Number of full days between now and the given ISO date. */
export function daysSince(isoDate: string | null): number {
  if (!isoDate) return Infinity;
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / MS_PER_DAY);
}

/** Human-readable "X days ago" string. */
export function daysAgoLabel(isoDate: string | null): string {
  if (!isoDate) return 'Never';
  const d = daysSince(isoDate);
  if (d === 0) return 'Today';
  if (d === 1) return '1 day ago';
  return `${d} days ago`;
}

/** True if isoDate is within `days` days of now. */
export function isWithinDays(isoDate: string | null, days: number): boolean {
  if (!isoDate) return false;
  return Date.now() - new Date(isoDate).getTime() <= days * MS_PER_DAY;
}

/** True if two ISO dates fall on the same local calendar day. */
export function isSameDay(a: string, b: string): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

/** True if `prev` is yesterday relative to `current` (local calendar). */
export function isConsecutiveDay(prev: string, current: string): boolean {
  const p = new Date(prev);
  const c = new Date(current);
  // Normalize to start of day
  const pDay = new Date(p.getFullYear(), p.getMonth(), p.getDate()).getTime();
  const cDay = new Date(c.getFullYear(), c.getMonth(), c.getDate()).getTime();
  return cDay - pDay === MS_PER_DAY;
}

/**
 * Given a comma-separated string like "Jess, babe, mi amor",
 * pick ONE random item (seeded by day so it's stable within a session).
 */
export function pickOne(csv: string): string {
  const items = csv.split(/,\s*/).map((s) => s.trim()).filter(Boolean);
  if (items.length <= 1) return csv.trim();
  const day = new Date().getDate();
  return items[day % items.length];
}

/**
 * Days until the next occurrence of a recurring annual date (birthday, anniversary).
 * Returns 0 on the day itself.
 */
export function daysUntilAnnual(isoDate: string | null): number | null {
  if (!isoDate) return null;
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  const thisYear = new Date(now.getFullYear(), d.getMonth(), d.getDate());
  // Normalize to start of today
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let diff = Math.round((thisYear.getTime() - today.getTime()) / MS_PER_DAY);
  if (diff < 0) {
    // Already passed this year → next year
    const nextYear = new Date(now.getFullYear() + 1, d.getMonth(), d.getDate());
    diff = Math.round((nextYear.getTime() - today.getTime()) / MS_PER_DAY);
  }
  return diff;
}

/**
 * Validate a YYYY-MM-DD string. Returns true if it parses to a real date.
 */
export function isValidDateString(str: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const d = new Date(str + 'T00:00:00');
  if (isNaN(d.getTime())) return false;
  // Verify it didn't roll over (e.g., 2025-02-30 → March)
  const [y, m, day] = str.split('-').map(Number);
  return d.getFullYear() === y && d.getMonth() === m - 1 && d.getDate() === day;
}
