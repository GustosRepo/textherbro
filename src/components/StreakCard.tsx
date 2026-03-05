import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StreakCardProps {
  label: string;
  streak: number;
  lastAction: string;
  emoji: string;
}

const getStreakVibe = (streak: number) => {
  if (streak >= 7) return { fire: '🔥🔥🔥', color: '#F5C518' };
  if (streak >= 4) return { fire: '🔥🔥', color: '#D4A816' };
  if (streak >= 2) return { fire: '🔥', color: '#C9961A' };
  if (streak === 1) return { fire: '', color: '#999999' };
  return { fire: '🧊', color: '#FF4444' };
};

export default function StreakCard({
  label,
  streak,
  lastAction,
  emoji,
}: StreakCardProps) {
  const vibe = getStreakVibe(streak);

  return (
    <View style={styles.card}>
      <Text style={styles.emoji}>{emoji}</Text>
      <View style={styles.info}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          {vibe.fire ? <Text style={styles.fireText}>{vibe.fire}</Text> : null}
        </View>
        <Text style={styles.lastAction}>{lastAction}</Text>
      </View>
      <View style={[styles.streakBadge, streak === 0 && styles.streakBadgeDead]}>
        <Text style={[styles.streakNumber, { color: vibe.color }]}>{streak}</Text>
        <Text style={[styles.streakLabel, { color: vibe.color }]}>
          {streak === 0 ? 'dead' : 'streak'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#161616',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  emoji: {
    fontSize: 28,
    marginRight: 14,
  },
  info: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  fireText: {
    fontSize: 14,
  },
  lastAction: {
    color: '#666666',
    fontSize: 12,
    marginTop: 2,
  },
  streakBadge: {
    backgroundColor: '#F5C51820',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 54,
  },
  streakBadgeDead: {
    backgroundColor: '#FF444420',
  },
  streakNumber: {
    fontSize: 20,
    fontWeight: '900',
  },
  streakLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
