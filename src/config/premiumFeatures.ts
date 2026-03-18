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
  | 'advanced_reminders'
  | 'sos_mode'
  | 'saved_lines'
  | 'smart_insights'
  | 'deep_questions'
  | 'multi_partner'
  | 'milestones';

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
    description: 'Birthday, anniversary, holiday, apology, and date night packs.',
    emoji: '🎁',
  },
  {
    key: 'tone_selector',
    label: 'Tone Selector',
    description: 'Switch between romantic, funny, spicy, and more pack styles.',
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
  {
    key: 'sos_mode',
    label: 'SOS Mode',
    description: 'Emergency recovery plan when things go cold. Step-by-step rescue.',
    emoji: '🆘',
  },
  {
    key: 'saved_lines',
    label: 'My Playbook',
    description: 'Save your best texts and come back to what works.',
    emoji: '📓',
  },
  {
    key: 'smart_insights',
    label: 'Smart Insights',
    description: 'AI-powered nudges based on your notes and activity.',
    emoji: '💡',
  },
  {
    key: 'deep_questions',
    label: 'Deep Questions',
    description: 'Meaningful conversation starters to actually connect.',
    emoji: '💬',
  },
  {
    key: 'multi_partner',
    label: 'Multiple Partners',
    description: 'Switch between separate partner profiles, each with their own streaks.',
    emoji: '👥',
  },
  {
    key: 'milestones',
    label: 'Milestones Tracker',
    description: 'Log your relationship milestones and celebrate them.',
    emoji: '🏅',
  },
];

// ─── Free Tier Limits ───────────────────────────────────────────────────────

export const FREE_LIMITS = {
  maxNotes: 10,
  maxRefreshesPerCategory: 3, // Free = up to 3 refreshes per category per day
  maxRemindersPerDay: 1,
};

// ─── Pricing ────────────────────────────────────────────────────────────────

export const PRICING = {
  monthly: { id: 'premium_monthly', price: '$4.99', period: 'month' },
  annual:  { id: 'premium_annual',  price: '$29.99', period: 'year', savings: '50%' },
} as const;

export type PricingTier = keyof typeof PRICING;
