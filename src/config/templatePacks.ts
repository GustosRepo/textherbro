/**
 * Template Packs — Structured suggestion pools with free/premium gating.
 *
 * Free users: Free Pack only
 * PRO users: All packs unlocked
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type PackId = 'free' | 'romantic' | 'funny' | 'spicy' | 'apology' | 'date_night' | 'birthday' | 'anniversary' | 'holiday';

export interface TemplatePack {
  id: PackId;
  label: string;
  emoji: string;
  description: string;
  isPremium: boolean;
  compliments: string[];
  checkIns: string[];
  dateIdeas: string[];
}

// ─── Pack Definitions ───────────────────────────────────────────────────────

export const TEMPLATE_PACKS: TemplatePack[] = [
  {
    id: 'free',
    label: 'Free Pack',
    emoji: '💬',
    description: 'Everyday essentials to keep you in the game.',
    isPremium: false,
    compliments: [
      "You look amazing today.",
      "I love spending time with you.",
      "Honestly, you make everything better.",
      "I just wanted you to know I appreciate you.",
      "You have the best smile.",
      "I'm so lucky to have you.",
      "You always know how to make my day better.",
      "I love the way you laugh.",
      "You're literally the highlight of my day.",
      "I don't tell you enough, but you're beautiful.",
    ],
    checkIns: [
      "Hey, how was your day?",
      "Just checking in. Everything good?",
      "Thinking about you. What are you up to?",
      "How's your day going?",
      "Did you eat today? Don't skip meals.",
      "Hope your day is going well. Miss you.",
      "What was the best part of your day?",
      "Anything stressing you out? I'm here.",
      "Random but I just wanted to hear from you.",
      "How are you doing? Like actually, not the polite version.",
    ],
    dateIdeas: [
      "Movie night at home. You pick the movie.",
      "Let's go for a walk tonight. No phones.",
      "Surprise picnic this weekend?",
      "Cook dinner together tonight.",
      "Grab coffee and just talk. Old school.",
      "Sunset drive with good music.",
      "Stay in, order food, and do nothing together.",
      "Ice cream run tonight. No excuse needed.",
      "Game night. Loser buys dinner.",
      "Find a rooftop or hilltop. Watch the city lights.",
    ],
  },
  {
    id: 'romantic',
    label: 'Romantic Pack',
    emoji: '❤️',
    description: 'When you need to bring the heat. Deep, real, intentional.',
    isPremium: true,
    compliments: [
      "Every time I look at you I fall a little harder.",
      "You are the most beautiful soul I've ever known.",
      "I want to be the reason you smile today.",
      "My heart is so full because of you.",
      "You're not just my girlfriend. You're my peace.",
      "I fall in love with you a little more every single day.",
      "The way you care about people makes me so proud to be yours.",
      "You are my favorite part of every single day.",
      "I never knew love like this until you.",
      "I could stare at you forever and never get bored.",
      "You make me want to be the best version of myself.",
      "Waking up knowing you're mine is the best feeling.",
    ],
    checkIns: [
      "I just wanted to remind you that I love you.",
      "Thinking about you and missing your voice.",
      "How's your heart today? I want the real answer.",
      "I'm always here for you. Don't forget that.",
      "Tell me about your day. I want every detail.",
      "I wish I was with you right now.",
      "You've been on my mind all day.",
      "I hope you feel loved today. Because you are.",
      "I can't wait to see you again.",
      "Your happiness means the world to me.",
    ],
    dateIdeas: [
      "Candlelit dinner at home. I'll cook.",
      "Slow dance in the living room. I'll put on our song.",
      "Write each other love letters and read them out loud.",
      "Recreate our first date.",
      "Stargazing with a blanket and hot chocolate.",
      "Couples massage followed by dinner.",
      "Take a sunset boat ride.",
      "Surprise weekend getaway. I'll plan everything.",
      "Watch the sunrise together. Set the alarm.",
      "Create a scrapbook of our relationship milestones.",
    ],
  },
  {
    id: 'funny',
    label: 'Funny Pack',
    emoji: '😂',
    description: 'Make her laugh. Humor wins hearts.',
    isPremium: true,
    compliments: [
      "You're so fine it's actually unfair to everyone else.",
      "If beauty was a crime you'd be serving life.",
      "You're out of my league and we both know it.",
      "I don't deserve you but I'm not giving you back.",
      "You're the reason my friends think I'm punching above my weight.",
      "Shoutout to your parents for that genetic masterpiece.",
      "You make me nervous. In a good way. Most of the time.",
      "I'd let you have the last slice. That's real love.",
      "If you were a vegetable, you'd be a cute-cumber.",
      "You're my favorite notification.",
    ],
    checkIns: [
      "Did you miss me today or is that a given?",
      "On a scale of 1 to missing me, how's your day going?",
      "Checking in because I haven't annoyed you enough today.",
      "Hey, weird question — are you okay? Because you look okay. Very okay.",
      "Did anything funny happen today? I need a laugh.",
      "I'm bored. Entertain me. Or let me entertain you.",
      "Just making sure you're still the cutest person alive. Yep, confirmed.",
      "I was gonna text something smooth but I forgot so... hey.",
      "What's for dinner? I mean hi, how are you, what's for dinner?",
      "Don't you hate it when your boyfriend is too handsome? Yeah me neither.",
    ],
    dateIdeas: [
      "Bad movie marathon. Worst reviews only.",
      "Go-kart racing. Loser does dishes for a week.",
      "Try to cook a fancy recipe we'll probably mess up.",
      "Karaoke night. No judgement. Okay, some judgement.",
      "Mini golf but every hole has a dare.",
      "Build the most chaotic blanket fort possible.",
      "Dollar store challenge. $5 budget, best gift wins.",
      "Try each other's favorite childhood snacks.",
      "People-watch at the mall and make up backstories.",
      "Compete in a TikTok challenge together.",
    ],
  },
  {
    id: 'spicy',
    label: 'Spicy Pack',
    emoji: '🌶️',
    description: 'Turn up the temperature. You know what to do.',
    isPremium: true,
    compliments: [
      "You have no idea what you do to me.",
      "That outfit today? You're dangerous.",
      "I can't stop thinking about you.",
      "You are absolutely stunning and I need you to know that.",
      "The way you look at me drives me crazy.",
      "You're the most attractive person I've ever seen.",
      "I'm so attracted to your mind. And everything else.",
      "You in that dress? My heart literally stops.",
      "You're my weakness and I'm not even mad about it.",
      "Distance between us is torture right now.",
    ],
    checkIns: [
      "Can't focus because I keep thinking about you.",
      "When can I see you? I'm getting impatient.",
      "You crossed my mind again. You live there rent-free.",
      "I had a dream about you last night.",
      "How are you so perfect?",
      "I miss your touch.",
      "I'm counting down until I see you next.",
      "Being away from you is harder than it should be.",
      "Just thinking about the last time we were together.",
      "I need a you refill ASAP.",
    ],
    dateIdeas: [
      "Spa night at home. Candles, music, the works.",
      "Dress up fancy and go nowhere. Just for the vibe.",
      "Late night drive. Park somewhere scenic.",
      "Cook together in dim lighting. Good music. No rush.",
      "Rooftop bar. Just the two of us.",
      "Stay in bed all day. No plans allowed.",
      "Hotel staycation. New room, new energy.",
      "Couples yoga. Just trust me on this one.",
      "Wine tasting night. At home. In pajamas.",
      "Beach bonfire. Late night. Just us.",
    ],
  },
  {
    id: 'apology',
    label: 'Apology Pack',
    emoji: '🕊️',
    description: "When you messed up. Own it. Fix it. Mean it.",
    isPremium: true,
    compliments: [
      "I messed up. But I need you to know how much you mean to me.",
      "You deserve better than what I gave you. I'm working on it.",
      "I'm sorry. And I mean it with my whole heart.",
      "You're the most important person in my life and I acted like you weren't.",
      "I hate that I hurt you. You don't deserve that.",
      "You're so patient with me and I don't take that for granted.",
      "I love you too much to keep repeating the same mistakes.",
      "You handle things with so much grace. I need to learn from you.",
      "I see how much effort you put in. I'm sorry I didn't match it.",
      "You make me a better person. Even when I fall short.",
    ],
    checkIns: [
      "Can we talk? I want to make things right.",
      "I've been thinking about what happened. Can I explain?",
      "How are you feeling about us? Be honest.",
      "I don't want this to sit between us. Let's talk.",
      "I know I have work to do. I'm showing up.",
      "Are you okay? I care about your answer more than you know.",
      "I'm sorry for the silence. I needed to think but I should've told you.",
      "I want us to be good. What do you need from me?",
      "I know words aren't enough. Tell me what actions you need.",
      "I'm not running from this. I'm here.",
    ],
    dateIdeas: [
      "Her favorite restaurant. Your treat. No phones.",
      "Flowers and a handwritten note. Leave it where she'll find it.",
      "Plan the day around everything she loves.",
      "Cook her favorite meal. Set the table properly.",
      "Take her somewhere that means something to both of you.",
      "Spa day for her. You plan everything.",
      "Drive to the place where you first said I love you.",
      "Do that thing she's been asking you to do for weeks.",
      "Surprise her with something she mentioned months ago.",
      "Give her a whole day of undivided attention.",
    ],
  },
  {
    id: 'date_night',
    label: 'Date Night Pack',
    emoji: '🍷',
    description: 'Curated date ideas to keep things fresh and exciting.',
    isPremium: true,
    compliments: [
      "Tonight is all about you.",
      "I love planning things for us.",
      "You deserve a night where you don't have to think about anything.",
      "I want to make tonight unforgettable.",
      "Best date? Any date with you.",
      "I've been looking forward to this all week.",
      "Getting ready to take out the most beautiful woman.",
      "Lucky me. Getting to spend tonight with you.",
      "I'm taking you out and I'm not taking no for an answer.",
      "You're worth every reservation I've ever made.",
    ],
    checkIns: [
      "What are you wearing tonight? Just so I can match your energy.",
      "I've got plans for us. Clear your schedule.",
      "Saturday night is ours. What's your vibe?",
      "I want to take you somewhere new. You in?",
      "Date night this week. Non-negotiable.",
      "Pick a night. I'll handle everything else.",
      "I just booked something. Don't ask. Just trust me.",
      "We haven't had a proper date in a minute. Let's fix that.",
      "Friday night. You and me. Say less.",
      "Cancel your plans. You've got better ones now.",
    ],
    dateIdeas: [
      "Tasting menu at that restaurant you bookmarked.",
      "Art gallery followed by a rooftop bar.",
      "Escape room challenge. Us vs the clock.",
      "Comedy show. Laugh until your stomach hurts.",
      "Cooking class — sushi, pasta, or Thai.",
      "Live music. Intimate venue. Front row.",
      "Farmers market brunch then thrift shopping.",
      "Boat rental. Pack snacks. Stay until sunset.",
      "Overnight road trip. No itinerary.",
      "Indoor rock climbing then smoothies.",
      "Paint and sip night. Compare masterpieces.",
      "Outdoor movie screening. Blankets and popcorn.",
    ],
  },
  {
    id: 'birthday',
    label: 'Birthday Pack',
    emoji: '🎂',
    description: "Her birthday is coming. Don't just wing it.",
    isPremium: true,
    compliments: [
      "Happy birthday to the most beautiful woman I know.",
      "Every year with you is better than the last.",
      "I'm so lucky I get to celebrate you today.",
      "You only get more amazing with time. Facts.",
      "Today is about you. I hope it's everything you deserve.",
      "Another year of being the greatest thing in my life.",
      "You deserve the whole world on your birthday. I'll start with today.",
      "Watching you grow is the best thing I get to witness.",
      "You were born and everything got better. That's just the truth.",
      "I love you more than you'll ever fully understand. Happy birthday.",
    ],
    checkIns: [
      "Happy birthday! Today is all about you. What do you want to do?",
      "It's your day, babe. I've got plans. Clear your schedule.",
      "Just wanted to be the first to say happy birthday. Did I make it?",
      "Did anyone sing to you yet? Because I'm prepared. Fair warning.",
      "Tell me your birthday wish. Maybe I can make it happen.",
      "What's something you've wanted to do for your birthday but never told me?",
      "I've been planning today for a while. I hope it shows.",
      "Birthday girl doesn't lift a finger today. That's the rule.",
      "How are you feeling on your birthday? I want the real answer.",
      "You deserve every good thing today. I'm going to make sure of it.",
    ],
    dateIdeas: [
      "Spa day — I booked everything already.",
      "Dinner at that restaurant she mentioned months ago.",
      "Surprise her with a thoughtful gift only YOU would know to give.",
      "Rent out her favorite activity for just the two of you.",
      "Hotel night in the city. Let her pick the skyline.",
      "Morning coffee delivery to bed. Then let her decide the rest.",
      "Invite her closest friends for a surprise get-together.",
      "Take her back to where your relationship started.",
      "Write her a letter listing your favorite things about her.",
      "Do a whole day of everything she loves, in order.",
    ],
  },
  {
    id: 'anniversary',
    label: 'Anniversary Pack',
    emoji: '💍',
    description: 'Celebrate what you built. Make it count.',
    isPremium: true,
    compliments: [
      "A whole year (or more) and I'd choose you every single time.",
      "The best decision I ever made was choosing you.",
      "You've made every day better since we started. I mean that.",
      "I love who we are together. Don't ever change that.",
      "Thank you for putting up with me. You're a saint and a queen.",
      "I used to wonder what real love felt like. Now I know.",
      "Every milestone means more because I get to share it with you.",
      "You make me want to be a better man. And I'm working on it.",
      "I didn't know it could be this good until you.",
      "Here's to more years of us. I can't wait.",
    ],
    checkIns: [
      "Happy anniversary. I can't believe how lucky I am.",
      "What's your favorite memory of us from this past year?",
      "I've been thinking about how far we've come. It's a lot.",
      "Do you remember our first [date / text / conversation]? I do.",
      "You still give me butterflies. Just so you know.",
      "What do you want to do to celebrate us tonight?",
      "I just want you to know — I'd do it all over again in a heartbeat.",
      "Another year of you. I'm the luckiest.",
      "Tell me something you love about us that you haven't said before.",
      "We should celebrate bigger. What are you thinking?",
    ],
    dateIdeas: [
      "Return to the place of your first date.",
      "Recreate exactly what you did on Day 1.",
      "Make a scrapbook of your best moments together.",
      "Write each other letters with your favorite memories — read them out loud.",
      "Book a night away. Same town, new energy.",
      "Personalized gift: something that represents your story.",
      "One-of-a-kind experience: hot air balloon, sunset sail, helicopter ride.",
      "Private chef experience at home — candles, music, the whole thing.",
      "Watch the video or look at photos from your first months together.",
      "Plan the next year together. Trips, goals, adventures. Make it real.",
    ],
  },
  {
    id: 'holiday',
    label: 'Holiday Pack',
    emoji: '🎁',
    description: 'Christmas, Valentine\'s, NYE — season-ready lines.',
    isPremium: true,
    compliments: [
      "The best gift I ever got was you. Corny but facts.",
      "This time of year hits different with you around.",
      "You make every holiday feel special without even trying.",
      "I'm grateful for you every day, but especially right now.",
      "You're my favorite reason to celebrate.",
      "Waking up to you during the holidays is everything.",
      "You somehow make the whole season feel warmer.",
      "Every holiday tradition is better because you're in it now.",
      "The only thing on my wish list is more time with you.",
      "You're my favorite part of every season.",
    ],
    checkIns: [
      "What's your favorite holiday tradition? I want to make it ours.",
      "Happy [holiday]! I'm so glad we get to spend this one together.",
      "What are you most excited about this season?",
      "Is there anything you really want this year? Tell me for real.",
      "I want to start a new tradition with you this year. You in?",
      "What does your ideal holiday look like? I'm taking notes.",
      "This is one of my favorite times of year because I get to celebrate with you.",
      "What's something you've always wanted to do around the holidays but never have?",
      "I'm thinking about you extra today. What are you up to?",
      "The holidays mean a lot more now that you're in my life.",
    ],
    dateIdeas: [
      "Hot chocolate run and holiday light drive.",
      "Christmas market or holiday festival just the two of you.",
      "Cook a holiday meal together from scratch.",
      "Matching pajamas and a holiday movie marathon.",
      "Ice skating followed by dinner.",
      "NYE countdown together — just you two, no crowded bar needed.",
      "Valentine's dinner at her absolute favorite spot.",
      "Write each other holiday cards. Real handwritten ones.",
      "Buy each other one meaningful gift with a $30 budget.",
      "Holiday staycation: decorate, cook, movies, no obligations.",
    ],
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

export function getAvailablePacks(isPro: boolean): TemplatePack[] {
  return TEMPLATE_PACKS.filter(p => !p.isPremium || isPro);
}

export function getPackById(id: PackId): TemplatePack | undefined {
  return TEMPLATE_PACKS.find(p => p.id === id);
}

export function getAllPackTemplates(isPro: boolean): {
  compliments: string[];
  checkIns: string[];
  dateIdeas: string[];
} {
  const packs = getAvailablePacks(isPro);
  return {
    compliments: packs.flatMap(p => p.compliments),
    checkIns: packs.flatMap(p => p.checkIns),
    dateIdeas: packs.flatMap(p => p.dateIdeas),
  };
}

/**
 * Returns templates for a specific pack (or all if no pack selected).
 * Always includes the free pack as a fallback base.
 */
export function getPackTemplatesFiltered(
  isPro: boolean,
  selectedPackId: PackId | null,
): {
  compliments: string[];
  checkIns: string[];
  dateIdeas: string[];
} {
  if (!selectedPackId || selectedPackId === 'free') {
    return getAllPackTemplates(isPro);
  }
  const selected = getPackById(selectedPackId);
  if (!selected || (selected.isPremium && !isPro)) {
    return getAllPackTemplates(false);
  }
  // Combine free pack + selected premium pack for variety
  const freePack = getPackById('free')!;
  return {
    compliments: [...freePack.compliments, ...selected.compliments],
    checkIns: [...freePack.checkIns, ...selected.checkIns],
    dateIdeas: [...freePack.dateIdeas, ...selected.dateIdeas],
  };
}
