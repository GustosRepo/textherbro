import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface StreakCardProps {
  label: string;
  streak: number;
  lastAction: string;
  emoji: string;
  /** True when the streak is about to break (missed exactly 1 day) */
  isShieldable?: boolean;
  /** How many shields available */
  shieldsAvailable?: number;
  onUseShield?: () => void;
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
  isShieldable = false,
  shieldsAvailable = 0,
  onUseShield,
}: StreakCardProps) {
  const vibe = getStreakVibe(streak);
  const showShield = isShieldable && shieldsAvailable > 0 && onUseShield;

  return (
    <View style={styles.card}>
      <Text style={styles.emoji}>{emoji}</Text>
      <View style={styles.info}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          {vibe.fire ? <Text style={styles.fireText}>{vibe.fire}</Text> : null}
        </View>
        <Text style={styles.lastAction}>{lastAction}</Text>
        {showShield && (
          <TouchableOpacity style={styles.shieldBtn} onPress={onUseShield} activeOpacity={0.7}>
            <Text style={styles.shieldBtnText}>🛡️ Use Shield</Text>
            <Text style={styles.shieldCount}>{shieldsAvailable} left</Text>
          </TouchableOpacity>
        )}
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
  shieldBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    backgroundColor: '#1E3A1E',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#2D5A2D',
  },
  shieldBtnText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '700',
  },
  shieldCount: {
    color: '#4CAF5099',
    fontSize: 11,
    fontWeight: '600',
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
