/**
 * Deterministic suggestion engine.
 *
 * Generates compliment / check-in / date-idea strings using partner favorites
 * and category-tagged memory-bank notes. No AI, no backend.
 *
 * Notes are surfaced DIRECTLY — their actual text appears in suggestions.
 * Categories drive placement:
 *   - 'she-said'  → check-ins ("She mentioned: '…'. Ask about it.")
 *   - 'date-idea' → date ideas ("From your notes: …")
 *   - 'gift'      → compliments & date ideas ("Surprise her with …")
 *   - 'general'   → sprinkled across all three pools
 */

import { Partner, NoteEntry, Favorites, ActivityLog } from '../types/partner';
import { pickOne } from '../utils/date';
import { getAllPackTemplates } from '../config/templatePacks';
import { isPremium } from './premium';

// ─── Types ──────────────────────────────────────────────────────────────────

export type SuggestionType = 'compliment' | 'checkIn' | 'date';

export interface Suggestions {
  compliments: string[];
  checkIns: string[];
  dateIdeas: string[];
}

export interface SuggestionContext {
  activityLog?: ActivityLog;
  birthdayDaysAway?: number | null;
  anniversaryDaysAway?: number | null;
  isPro?: boolean;
}

// ─── Time of Day ────────────────────────────────────────────────────────────

type TimeOfDay = 'morning' | 'afternoon' | 'evening';

function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  return 'evening';
}

// ─── Public API ─────────────────────────────────────────────────────────────

export function generateSuggestions(
  partner: Partner | null,
  notes: NoteEntry[],
  context?: SuggestionContext,
): Suggestions {
  const rawName = partner?.nickname || partner?.name || 'her';
  const name = pickOne(rawName);
  const favs = partner?.favorites ?? {};

  // Inject template pack content based on subscription status
  const packTemplates = getAllPackTemplates(context?.isPro ?? false);

  // Bucket notes by category (use at most 10 recent per bucket)
  const byCategory = {
    'she-said': notes.filter((n) => n.category === 'she-said').slice(0, 10),
    'date-idea': notes.filter((n) => n.category === 'date-idea').slice(0, 10),
    gift: notes.filter((n) => n.category === 'gift').slice(0, 10),
    general: notes.filter((n) => n.category === 'general').slice(0, 10),
  };

  return {
    compliments: scoreAndSort(
      [...buildCompliments(name, favs, byCategory, context), ...packTemplates.compliments],
      partner,
      notes,
    ),
    checkIns: scoreAndSort(
      [...buildCheckIns(name, favs, byCategory, context), ...packTemplates.checkIns],
      partner,
      notes,
    ),
    dateIdeas: scoreAndSort(
      [...buildDateIdeas(name, favs, byCategory, context), ...packTemplates.dateIdeas],
      partner,
      notes,
    ),
  };
}

/** Pick a random item from the pool, cycling through an index. */
export function pickSuggestion(pool: string[], index: number): string {
  if (pool.length === 0) return 'You got this, king.';
  return pool[index % pool.length];
}

// ─── Note Buckets Type ──────────────────────────────────────────────────────

type NoteBuckets = {
  'she-said': NoteEntry[];
  'date-idea': NoteEntry[];
  gift: NoteEntry[];
  general: NoteEntry[];
};

// ─── Compliment Templates ───────────────────────────────────────────────────

function buildCompliments(
  name: string,
  favs: Favorites,
  notes: NoteBuckets,
  context?: SuggestionContext,
): string[] {
  const list: string[] = [];

  // Generic (always present)
  list.push(
    `You look amazing today, ${name}.`,
    `I love spending time with you.`,
    `Honestly, you make everything better.`,
    `I just wanted you to know I appreciate you.`,
    `You have the best smile, ${name}.`,
    `I'm so lucky to have you.`,
    `You always know how to make my day better.`,
    `I love the way you laugh.`,
    `${name}, you're literally the highlight of my day.`,
    `You're so smart it's actually intimidating sometimes.`,
    `I don't tell you enough, but you're beautiful.`,
    `The way you care about people is one of my favorite things about you.`,
    `I was just thinking about you and had to say something.`,
    `You're the only person I never get tired of talking to.`,
    `${name}, you genuinely inspire me to be better.`,
    `I noticed how hard you've been working. I see you and I'm proud.`,
    `Your energy is literally contagious. Everyone around you feels it.`,
    `I love how passionate you get about things you care about.`,
    `You're the kind of person people write songs about.`,
    `Every time I see you I think I got lucky.`,
  );

  // Personalized from favorites
  if (favs.color) {
    const color = pickOne(favs.color);
    list.push(`You look so good in ${color}. Wear that more.`);
  }
  if (favs.hobby) {
    const hobby = pickOne(favs.hobby);
    list.push(
      `I love that you're into ${hobby}. That's so attractive.`,
      `Watching you do ${hobby} is one of my favorite things.`,
    );
  }
  if (favs.music) {
    const music = pickOne(favs.music);
    list.push(
      `That ${music} playlist you made? Perfect.`,
      `Your taste in music? ${music}? Actually fire.`,
    );
  }
  if (favs.brand) {
    const brand = pickOne(favs.brand);
    list.push(`You always look fire in ${brand}.`);
  }

  // Gift notes → compliment context ("I got you something" energy)
  for (const note of notes.gift) {
    list.push(`Surprise her with: "${note.text}". She'll love it.`);
  }

  // General notes sprinkled in
  for (const note of notes.general) {
    list.push(`You wrote: "${note.text}". Use that to say something sweet.`);
  }

  // ── Time-of-day awareness ──
  const compTod = getTimeOfDay();
  if (compTod === 'morning') {
    list.push(
      `Good morning beautiful. Just wanted to start your day right.`,
      `Rise and shine, ${name}. My favorite person is awake.`,
      `Morning, ${name}. You were literally the first thing I thought about.`,
    );
  } else if (compTod === 'evening') {
    list.push(
      `You made my whole day better, ${name}. Just wanted you to know.`,
      `End of the day and you're still on my mind.`,
      `You looked good today. Just saying.`,
    );
  }

  // ── Occasion awareness ──
  if (context?.birthdayDaysAway != null && context.birthdayDaysAway > 0 && context.birthdayDaysAway <= 7) {
    list.push(
      `Your birthday is coming up and I just want you to know how special you are.`,
      `Birthday countdown: ${context.birthdayDaysAway} days. Making sure it's perfect for you.`,
      `Pre-birthday compliment: you're literally the best thing in my life, ${name}.`,
    );
  }
  if (context?.anniversaryDaysAway != null && context.anniversaryDaysAway > 0 && context.anniversaryDaysAway <= 7) {
    list.push(
      `Our anniversary is almost here. Best decision I ever made.`,
      `${context.anniversaryDaysAway} days until our anniversary. Still falling for you.`,
    );
  }

  // ── Streak encouragement ──
  if (context?.activityLog && context.activityLog.complimentStreak >= 5) {
    const streak = context.activityLog.complimentStreak;
    list.push(
      `You're on a ${streak}-day compliment streak! Keep this energy, king.`,
      `Day ${streak} of making her feel special. That's king behavior.`,
    );
  }

  return list;
}

// ─── Check-in Templates ────────────────────────────────────────────────────

function buildCheckIns(
  name: string,
  favs: Favorites,
  notes: NoteBuckets,
  context?: SuggestionContext,
): string[] {
  const list: string[] = [];

  // Generic
  list.push(
    `Hey ${name}, how was your day?`,
    `Just checking in. Everything good?`,
    `Thinking about you. What are you up to?`,
    `How's your day going, ${name}?`,
    `Did you eat today? Don't skip meals.`,
    `Hope your day is going well. Miss you.`,
    `What was the best part of your day?`,
    `Anything stressing you out? I'm here.`,
    `Good morning ${name}. Just wanted to say hi.`,
    `Hey, I know today might be busy, but I'm thinking of you.`,
    `Random but I just wanted to hear from you.`,
    `How are you doing? Like actually, not the polite version.`,
    `What's on your mind today, ${name}?`,
    `Did anything make you smile today?`,
    `Just sending some good energy your way.`,
    `Hey, you've been quiet. Everything okay?`,
    `Tell me something good that happened today.`,
    `I know you're busy but take a break and drink some water.`,
    `What's something you're looking forward to this week?`,
    `Thinking about the last time I saw you smile. Need a refill.`,
  );

  // Personalized
  if (favs.hobby) {
    const hobby = pickOne(favs.hobby);
    list.push(
      `How's the ${hobby} going lately?`,
      `Did you get to do any ${hobby} today?`,
    );
  }
  if (favs.food) {
    const food = pickOne(favs.food);
    list.push(`Did you have any ${food} today? You deserve it.`);
  }

  // "She said" notes → direct check-in prompts
  for (const note of notes['she-said']) {
    list.push(
      `She mentioned: "${note.text}". Bring it up and ask about it.`,
      `Remember she told you: "${note.text}". Check in on that.`,
    );
  }

  // General notes as conversation starters
  for (const note of notes.general) {
    list.push(`From your notes: "${note.text}". Good excuse to text her.`);
  }

  // ── Time-of-day awareness ──
  const ciTod = getTimeOfDay();
  if (ciTod === 'morning') {
    list.push(
      `Good morning ${name}. How'd you sleep?`,
      `Morning! What's on your agenda today?`,
      `Rise and shine. Don't forget to eat breakfast, ${name}.`,
    );
  } else if (ciTod === 'afternoon') {
    list.push(
      `How's your afternoon going, ${name}?`,
      `Just thinking about you in the middle of my day.`,
      `Hope your afternoon is going smooth.`,
    );
  } else {
    list.push(
      `How was your day? Tell me everything.`,
      `Winding down. What was the highlight of your day, ${name}?`,
      `Good night ${name}. Hope you had a great day.`,
    );
  }

  // ── Streak encouragement ──
  if (context?.activityLog && context.activityLog.checkInStreak >= 5) {
    const streak = context.activityLog.checkInStreak;
    list.push(
      `${streak}-day check-in streak! She knows you care.`,
      `Day ${streak} of showing up. She sees it.`,
    );
  }

  return list;
}

// ─── Date Idea Templates ───────────────────────────────────────────────────

function buildDateIdeas(
  name: string,
  favs: Favorites,
  notes: NoteBuckets,
  context?: SuggestionContext,
): string[] {
  const list: string[] = [];

  // Generic
  list.push(
    `Movie night at home. You pick the movie.`,
    `Let's go for a walk tonight. No phones.`,
    `Surprise picnic this weekend?`,
    `Cook dinner together tonight.`,
    `Let's try that new place everyone's been talking about.`,
    `Sunset drive with good music.`,
    `Bookstore date. Pick a book for each other.`,
    `Grab coffee and just talk. Old school.`,
    `Game night. Loser buys dinner.`,
    `Stay in, order food, and do nothing together.`,
    `Farmers market Saturday morning. Get breakfast after.`,
    `Ice cream run tonight. No excuse needed.`,
    `Find a rooftop or hilltop. Watch the city lights.`,
    `Thrift store challenge. $10 budget. Best outfit wins.`,
    `Build a blanket fort. I'm serious.`,
    `Arcade or bowling. Something competitive.`,
    `Surprise her with breakfast in bed this weekend.`,
    `Take her to a spot she's never been before.`,
    `Plan a whole day with no plans. Just follow the vibes.`,
    `Mini road trip. 1-2 hours. New town, new food.`,
  );

  // Personalized
  if (favs.restaurant) {
    const restaurant = pickOne(favs.restaurant);
    list.push(
      `Let's go to ${restaurant} this weekend. My treat.`,
      `How about ${restaurant} on Friday? I'll make a reservation.`,
    );
  }
  if (favs.food) {
    const food = pickOne(favs.food);
    list.push(
      `Let me take you to get ${food} tonight.`,
      `I'll cook ${food} for you this weekend.`,
    );
  }
  if (favs.flowers) {
    const flowers = pickOne(favs.flowers);
    list.push(`I saw ${flowers} today and thought of you. Picking some up.`);
  }
  if (favs.hobby) {
    const hobby = pickOne(favs.hobby);
    list.push(`Let's do ${hobby} together this weekend.`);
  }
  if (favs.music) {
    const music = pickOne(favs.music);
    list.push(`There might be a ${music} show coming up. Want to go?`);
  }

  // Date-idea notes surfaced directly
  for (const note of notes['date-idea']) {
    list.push(`From your notes: "${note.text}". Make it happen.`);
  }

  // Gift notes can also inspire dates
  for (const note of notes.gift) {
    list.push(`She wants "${note.text}". Plan a date around getting it for her.`);
  }

  // General notes as date inspiration
  for (const note of notes.general) {
    list.push(`Your note: "${note.text}". Turn that into a date idea.`);
  }

  // ── Time-of-day awareness ──
  const dateTod = getTimeOfDay();
  if (dateTod === 'evening') {
    list.push(
      `Let's order in tonight and just chill together.`,
      `Night drive? Good music, no destination.`,
      `Spontaneous move: go grab dessert right now.`,
    );
  }

  // ── Occasion awareness ──
  if (context?.birthdayDaysAway != null && context.birthdayDaysAway > 0 && context.birthdayDaysAway <= 7) {
    list.push(
      `Birthday dinner — where does she want to go? Your treat.`,
      `What does she want for her birthday? Start planning now.`,
      `Plan something special for her birthday. ${context.birthdayDaysAway} days left.`,
    );
  }
  if (context?.anniversaryDaysAway != null && context.anniversaryDaysAway > 0 && context.anniversaryDaysAway <= 7) {
    list.push(
      `Anniversary plans: something special. Dress up.`,
      `Recreate your first date for your anniversary.`,
      `Anniversary in ${context.anniversaryDaysAway} days. Don't wing it.`,
    );
  }

  return list;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Score templates by relevance to partner data,
 * then sort high-relevance items first before shuffling within tiers.
 */
function scoreAndSort(templates: string[], partner: Partner | null, notes: NoteEntry[]): string[] {
  // Deduplicate
  const unique = [...new Set(templates)];

  // Build keyword set from partner data
  const keywords: string[] = [];
  if (partner) {
    const favs = partner.favorites ?? {};
    if (favs.food) favs.food.split(',').forEach(w => keywords.push(w.trim().toLowerCase()));
    if (favs.flowers) favs.flowers.split(',').forEach(w => keywords.push(w.trim().toLowerCase()));
    if (favs.restaurant) favs.restaurant.split(',').forEach(w => keywords.push(w.trim().toLowerCase()));
    if (favs.color) favs.color.split(',').forEach(w => keywords.push(w.trim().toLowerCase()));
    if (favs.brand) favs.brand.split(',').forEach(w => keywords.push(w.trim().toLowerCase()));
    if (favs.music) favs.music.split(',').forEach(w => keywords.push(w.trim().toLowerCase()));
    if (favs.hobby) favs.hobby.split(',').forEach(w => keywords.push(w.trim().toLowerCase()));
    if (partner.name) keywords.push(partner.name.toLowerCase());
    if (partner.nickname) partner.nickname.split(',').forEach(w => keywords.push(w.trim().toLowerCase()));
  }

  // Add note keywords (first word of each note, lowered)
  for (const note of notes) {
    const words = note.text.toLowerCase().split(/\s+/).slice(0, 3);
    keywords.push(...words);
  }

  // Score each template
  const scored = unique.map(text => {
    let relevance = 0;
    const lower = text.toLowerCase();
    for (const kw of keywords) {
      if (kw.length >= 3 && lower.includes(kw)) {
        relevance += 2;
      }
    }
    // Bonus for templates referencing notes directly
    if (lower.includes('your notes') || lower.includes('she mentioned') || lower.includes('you wrote')) {
      relevance += 1;
    }
    return { text, relevance };
  });

  // Sort: high relevance first, then shuffle within each tier
  scored.sort((a, b) => b.relevance - a.relevance);

  // Group into tiers (high: 3+, medium: 1-2, low: 0)
  const high = scored.filter(s => s.relevance >= 3).map(s => s.text);
  const medium = scored.filter(s => s.relevance >= 1 && s.relevance < 3).map(s => s.text);
  const low = scored.filter(s => s.relevance === 0).map(s => s.text);

  return [...shuffle(high), ...shuffle(medium), ...shuffle(low)];
}

function shuffle(arr: string[]): string[] {
  // Deduplicate first
  const unique = [...new Set(arr)];
  // Fisher-Yates with day-based seed so it feels fresh daily but stable within a session
  const seed = new Date().toDateString();
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  for (let i = unique.length - 1; i > 0; i--) {
    hash = (hash * 16807 + 1) | 0;
    const j = ((hash >>> 0) % (i + 1));
    [unique[i], unique[j]] = [unique[j], unique[i]];
  }
  return unique;
}
