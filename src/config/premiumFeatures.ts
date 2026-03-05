/**
 * Premium feature definitions, free-tier limits, and pricing config.
 */

// ─── Feature Keys ───────────────────────────────────────────────────────────

export type PremiumFeatureKey =
  | 'unlimited_suggestions'
  | 'unlimited_notes'
  | 'special_packs'
  | 'tone_selector'
  | 'weekly_report'
  | 'streak_shields'
  | 'score_history'
  | 'advanced_reminders';

// ─── Feature Definitions ────────────────────────────────────────────────────

export interface PremiumFeature {
  key: PremiumFeatureKey;
  label: string;
  description: string;
  emoji: string;
}

export const PREMIUM_FEATURES: PremiumFeature[] = [
  {
    key: 'unlimited_suggestions',
    label: 'Unlimited Suggestions',
    description: 'Never run out of things to say. Refresh as many times as you want.',
    emoji: '💬',
  },
  {
    key: 'unlimited_notes',
    label: 'Unlimited Notes',
    description: 'Store everything about her. No cap on your intel.',
    emoji: '🧠',
  },
  {
    key: 'special_packs',
    label: 'Special Occasion Packs',
    description: 'Birthday, anniversary, apology, and holiday suggestion packs.',
    emoji: '🎁',
  },
  {
    key: 'tone_selector',
    label: 'Tone Selector',
    description: 'Switch between funny, romantic, spicy, and sweet suggestions.',
    emoji: '🎭',
  },
  {
    key: 'weekly_report',
    label: 'Weekly Report',
    description: 'Get a relationship scorecard every Sunday.',
    emoji: '📊',
  },
  {
    key: 'streak_shields',
    label: 'Streak Shields',
    description: "Miss a day? Shield saves your streak. 1 per week.",
    emoji: '🛡️',
  },
  {
    key: 'score_history',
    label: 'Score History',
    description: 'See your score trend over time. Track your growth.',
    emoji: '📈',
  },
  {
    key: 'advanced_reminders',
    label: 'Advanced Reminders',
    description: 'Custom times, smart triggers, and streak warnings.',
    emoji: '⏰',
  },
];

// ─── Free Tier Limits ───────────────────────────────────────────────────────

export const FREE_LIMITS = {
  maxNotes: 10,
  maxRefreshesPerCategory: 0, // Free = 1 suggestion per category (no refreshes)
  maxRemindersPerDay: 1,
};

// ─── Pricing ────────────────────────────────────────────────────────────────

export const PRICING = {
  monthly: { id: 'premium_monthly', price: '$4.99', period: 'month' },
  annual: { id: 'premium_annual', price: '$29.99', period: 'year', savings: '50%' },
  lifetime: { id: 'premium_lifetime', price: '$39.99', period: 'forever' },
} as const;

export type PricingTier = keyof typeof PRICING;
