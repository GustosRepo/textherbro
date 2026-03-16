/**
 * SOS Mode — Emergency relationship recovery actions.
 * Provides a step-by-step action plan when things go cold or an argument happened.
 */

export type SOSScenario = 'gone_cold' | 'argument' | 'she_is_distant' | 'big_fumble';

export interface SOSStep {
  step: number;
  timing: string; // "Right now" | "In 2 hours" | "Tonight" etc.
  action: string;
  message?: string; // Optional copy-paste text
  emoji: string;
}

export interface SOSPlan {
  scenario: SOSScenario;
  title: string;
  subtitle: string;
  urgency: 'low' | 'medium' | 'high';
  steps: SOSStep[];
}

const PLANS: Record<SOSScenario, SOSPlan> = {
  gone_cold: {
    scenario: 'gone_cold',
    title: 'She\'s Gone Cold',
    subtitle: 'Communication dropped off. She\'s pulling back. Here\'s how to re-engage without looking desperate.',
    urgency: 'medium',
    steps: [
      {
        step: 1,
        timing: 'Right now',
        action: 'Send a low-pressure re-engagement text. No apology, no "u ok?" energy.',
        message: 'Hey, been thinking about you. Hope your week is going well.',
        emoji: '💬',
      },
      {
        step: 2,
        timing: 'Wait 24 hours',
        action: 'Do NOT double text or check if she saw it. Give her space to respond.',
        emoji: '⏳',
      },
      {
        step: 3,
        timing: 'Day 2 (if no response)',
        action: 'Send something light and engaging — a meme, something funny you saw that reminded you of her.',
        emoji: '😄',
      },
      {
        step: 4,
        timing: 'Day 3',
        action: 'Invite her to something specific. Not "wanna hang?" — something real.',
        message: 'I\'m checking out that new spot Saturday. You should come.',
        emoji: '🎯',
      },
      {
        step: 5,
        timing: 'If she responds',
        action: 'Be warm, be present, be the version of yourself she fell for. Don\'t overcompensate. Just show up.',
        emoji: '👑',
      },
    ],
  },

  argument: {
    scenario: 'argument',
    title: 'After an Argument',
    subtitle: 'Things got heated. Now what? Execute this in order. Don\'t skip steps.',
    urgency: 'high',
    steps: [
      {
        step: 1,
        timing: 'Immediately after',
        action: 'Give her space. Don\'t force resolution when emotions are hot. Silence right now is strategic, not cold.',
        emoji: '🛑',
      },
      {
        step: 2,
        timing: '2-4 hours later',
        action: 'Send a calm, accountable text. No "but you also..." energy. Own your part.',
        message: 'Hey. I\'ve been thinking about what happened. I\'m sorry for how I handled that. Can we talk?',
        emoji: '🕊️',
      },
      {
        step: 3,
        timing: 'When she responds',
        action: 'Listen more than you speak. Validate her feelings before explaining yours.',
        emoji: '👂',
      },
      {
        step: 4,
        timing: 'Resolution',
        action: 'Once it\'s resolved, don\'t keep bringing it up. Move forward with action, not just words.',
        emoji: '🤝',
      },
      {
        step: 5,
        timing: 'Next 24 hours',
        action: 'Do something thoughtful, not grand. Her favorite snack. A small gesture. Proof over promises.',
        emoji: '🎁',
      },
    ],
  },

  she_is_distant: {
    scenario: 'she_is_distant',
    title: 'She\'s Distant',
    subtitle: 'She\'s there but not fully there. Something is off. Here\'s how to open the door without being pushy.',
    urgency: 'medium',
    steps: [
      {
        step: 1,
        timing: 'Today',
        action: 'Check in genuinely — make it about HER, not about "us."',
        message: 'Hey, you\'ve seemed a little off lately. I\'m not pushing but I\'m here if you want to talk.',
        emoji: '💙',
      },
      {
        step: 2,
        timing: 'Give her space',
        action: 'Don\'t interrogate. One invite to talk is enough. Chasing makes it worse.',
        emoji: '🧘',
      },
      {
        step: 3,
        timing: 'Meanwhile',
        action: 'Look inward — is there something YOU\'ve been neglecting? Are you showing up consistently?',
        emoji: '🪞',
      },
      {
        step: 4,
        timing: 'Days 2-3',
        action: 'Keep the normal cadence. Text her how you usually do. Be steady, not anxious.',
        emoji: '📱',
      },
      {
        step: 5,
        timing: 'When she opens up',
        action: 'Just listen. No solutions, no defending yourself. She needs to feel heard.',
        emoji: '❤️',
      },
    ],
  },

  big_fumble: {
    scenario: 'big_fumble',
    title: 'Major Fumble',
    subtitle: 'You really messed up. This is a full recovery protocol. Follow every step.',
    urgency: 'high',
    steps: [
      {
        step: 1,
        timing: 'Right now — before you do anything else',
        action: 'Stop. Don\'t over-explain, don\'t make excuses, don\'t send 4 texts in a row. One message, clean, real.',
        message: 'I know what I did was wrong. I\'m not going to make excuses. I\'m sorry.',
        emoji: '🛑',
      },
      {
        step: 2,
        timing: 'Give her time',
        action: 'She needs space to process. Respect that. Every hour you give her is an investment.',
        emoji: '⏳',
      },
      {
        step: 3,
        timing: 'When she\'s ready to talk',
        action: 'Full accountability. "I was wrong because..." not "I\'m sorry you felt..." — own every part of it.',
        emoji: '🎯',
      },
      {
        step: 4,
        timing: 'Post-conversation',
        action: 'Ask her what she needs. Don\'t assume a grand gesture fixes it. Sometimes she just needs consistency.',
        emoji: '🤝',
      },
      {
        step: 5,
        timing: 'Moving forward',
        action: 'Change the behavior that caused the damage. Words are cheap. She\'ll watch what you do next.',
        emoji: '👑',
      },
    ],
  },
};

export function getSOSPlan(scenario: SOSScenario): SOSPlan {
  return PLANS[scenario];
}

export const SOS_SCENARIOS: { id: SOSScenario; label: string; emoji: string; desc: string }[] = [
  { id: 'gone_cold',     label: 'She\'s Gone Cold',   emoji: '🧊', desc: 'Communication dropped off' },
  { id: 'argument',      label: 'After an Argument',  emoji: '💥', desc: 'Things got heated' },
  { id: 'she_is_distant',label: 'She\'s Distant',     emoji: '🌫️', desc: 'There but not fully there' },
  { id: 'big_fumble',    label: 'Major Fumble',       emoji: '🚨', desc: 'You really messed up' },
];
