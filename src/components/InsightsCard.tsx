/**
 * Smart Partner Insights — surfaces actionable nudges based on partner data,
 * notes, and activity log. PRO only.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Partner, NoteEntry, ActivityLog } from '../types/partner';
import { daysSince, daysUntilAnnual } from '../utils/date';

export interface Insight {
  id: string;
  emoji: string;
  text: string;
  urgency: 'high' | 'medium' | 'low';
}

function computeInsights(
  partner: Partner,
  notes: NoteEntry[],
  log: ActivityLog,
): Insight[] {
  const insights: Insight[] = [];

  // ── Birthday proximity ──
  const bdayDays = daysUntilAnnual(partner.birthday);
  if (bdayDays !== null && bdayDays <= 14 && bdayDays > 0) {
    const hasGiftNote = notes.some((n) => n.category === 'gift');
    insights.push({
      id: 'bday_soon',
      emoji: '🎂',
      text: hasGiftNote
        ? `Her birthday is in ${bdayDays} day${bdayDays !== 1 ? 's' : ''} — you have gift ideas saved. Execute.`
        : `Her birthday is in ${bdayDays} day${bdayDays !== 1 ? 's' : ''} and you have no gift idea saved. Fix that.`,
      urgency: bdayDays <= 3 ? 'high' : 'medium',
    });
  }

  // ── Anniversary proximity ──
  const anniDays = daysUntilAnnual(partner.anniversary);
  if (anniDays !== null && anniDays <= 14 && anniDays > 0) {
    insights.push({
      id: 'anni_soon',
      emoji: '💍',
      text: `Anniversary in ${anniDays} day${anniDays !== 1 ? 's' : ''}. Plan something special. Don't wing it.`,
      urgency: anniDays <= 3 ? 'high' : 'medium',
    });
  }

  // ── Compliment gap ──
  const compDays = daysSince(log.lastCompliment);
  if (compDays >= 3 && compDays !== Infinity) {
    insights.push({
      id: 'no_compliment',
      emoji: '😍',
      text: `You haven't complimented her in ${compDays} days. She notices.`,
      urgency: compDays >= 5 ? 'high' : 'medium',
    });
  }
  if (compDays === Infinity) {
    insights.push({
      id: 'never_complimented',
      emoji: '😬',
      text: 'You\'ve never logged a compliment. Start today.',
      urgency: 'high',
    });
  }

  // ── Date drought ──
  const dateDays = daysSince(log.lastDate);
  if (dateDays >= 21 && dateDays !== Infinity) {
    const dateNotes = notes.filter((n) => n.category === 'date-idea');
    insights.push({
      id: 'no_date',
      emoji: '🌹',
      text: dateNotes.length > 0
        ? `It's been ${dateDays} days since your last date. You have ${dateNotes.length} date idea${dateNotes.length !== 1 ? 's' : ''} saved — use one.`
        : `It's been ${dateDays} days since your last date. Plan something.`,
      urgency: dateDays >= 30 ? 'high' : 'medium',
    });
  }

  // ── Un-acted date ideas from notes ──
  const unreferencedDateIdeas = notes
    .filter((n) => n.category === 'date-idea')
    .filter((n) => {
      const weeksOld = daysSince(n.createdAt) / 7;
      return weeksOld >= 3;
    });
  if (unreferencedDateIdeas.length > 0 && dateDays < 21) {
    const oldest = unreferencedDateIdeas[0];
    insights.push({
      id: 'stale_date_idea',
      emoji: '📝',
      text: `You saved "${oldest.text.slice(0, 50)}${oldest.text.length > 50 ? '...' : ''}" weeks ago and never used it.`,
      urgency: 'low',
    });
  }

  // ── She-Said note follow-up ──
  const sheSaidNotes = notes.filter((n) => n.category === 'she-said');
  if (sheSaidNotes.length > 0) {
    const recent = sheSaidNotes.find((n) => daysSince(n.createdAt) <= 14);
    if (recent) {
      insights.push({
        id: 'she_said_followup',
        emoji: '💬',
        text: `She said: "${recent.text.slice(0, 60)}${recent.text.length > 60 ? '...' : ''}" — Did you follow up?`,
        urgency: 'low',
      });
    }
  }

  // ── Streak in danger ──
  const checkInDays = daysSince(log.lastCheckIn);
  if (checkInDays >= 2 && log.checkInStreak >= 3) {
    insights.push({
      id: 'streak_risk',
      emoji: '🔥',
      text: `Your ${log.checkInStreak}-day check-in streak is at risk. Send one today.`,
      urgency: 'high',
    });
  }

  // ── No notes at all ──
  if (notes.length === 0) {
    insights.push({
      id: 'no_notes',
      emoji: '🧠',
      text: `Your Memory Bank is empty. Add what she likes, what she's said, gift ideas. It all becomes ammo.`,
      urgency: 'low',
    });
  }

  // Sort: high first, then medium, then low. Max 3.
  const order = { high: 0, medium: 1, low: 2 };
  return insights.sort((a, b) => order[a.urgency] - order[b.urgency]).slice(0, 3);
}

interface InsightsCardProps {
  partner: Partner;
  notes: NoteEntry[];
  log: ActivityLog;
  onUpgrade: () => void;
}

export default function InsightsCard({ partner, notes, log, onUpgrade }: InsightsCardProps) {
  const insights = computeInsights(partner, notes, log);

  if (insights.length === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.headerEmoji}>💡</Text>
          <Text style={styles.title}>Smart Insights</Text>
          <View style={styles.proBadge}><Text style={styles.proBadgeText}>PRO</Text></View>
        </View>
        <Text style={styles.allGood}>You're locked in, bro. Activity looks solid.</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>💡</Text>
        <Text style={styles.title}>Smart Insights</Text>
        <View style={styles.proBadge}><Text style={styles.proBadgeText}>PRO</Text></View>
      </View>
      {insights.map((insight) => (
        <View
          key={insight.id}
          style={[
            styles.insightRow,
            insight.urgency === 'high' && styles.insightRowHigh,
          ]}
        >
          <Text style={styles.insightEmoji}>{insight.emoji}</Text>
          <Text style={styles.insightText}>{insight.text}</Text>
        </View>
      ))}
    </View>
  );
}

/** Locked version shown to free users */
export function InsightsCardLocked({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onUpgrade} activeOpacity={0.8}>
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>💡</Text>
        <Text style={styles.title}>Smart Insights</Text>
        <View style={styles.proBadge}><Text style={styles.proBadgeText}>PRO</Text></View>
      </View>
      <View style={styles.lockedOverlay}>
        <Text style={styles.lockEmoji}>🔒</Text>
        <Text style={styles.lockedText}>Get AI-powered nudges about what she needs right now.</Text>
        <Text style={styles.lockedCTA}>Upgrade to unlock →</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#161616',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  headerEmoji: { fontSize: 18 },
  title: { color: '#F5C518', fontSize: 16, fontWeight: '900', flex: 1 },
  proBadge: {
    backgroundColor: '#F5C51820',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#F5C518',
  },
  proBadgeText: { color: '#F5C518', fontSize: 10, fontWeight: '900' },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#1E1E1E',
  },
  insightRowHigh: { borderLeftWidth: 3, borderLeftColor: '#FF4444', paddingLeft: 12 },
  insightEmoji: { fontSize: 16, marginTop: 1 },
  insightText: { color: '#CCCCCC', fontSize: 13, lineHeight: 19, flex: 1 },
  allGood: { color: '#4CAF50', fontSize: 14, fontStyle: 'italic' },
  lockedOverlay: { alignItems: 'center', paddingVertical: 12 },
  lockEmoji: { fontSize: 28, marginBottom: 8 },
  lockedText: { color: '#999999', fontSize: 13, textAlign: 'center', marginBottom: 8 },
  lockedCTA: { color: '#F5C518', fontSize: 14, fontWeight: '800' },
});
