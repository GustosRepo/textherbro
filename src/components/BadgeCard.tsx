import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BADGE_DEFINITIONS, AwardedBadge } from '../services/badges';

interface BadgeCardProps {
  badges: AwardedBadge[];
}

export default function BadgeCard({ badges }: BadgeCardProps) {
  if (BADGE_DEFINITIONS.length === 0) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Badges</Text>
      <View style={styles.badgeRow}>
        {BADGE_DEFINITIONS.map((def) => {
          const awarded = badges.find((b) => b.id === def.id);
          return (
            <View
              key={def.id}
              style={[styles.badge, !awarded && styles.badgeLocked]}
            >
              <Text style={styles.badgeEmoji}>{def.emoji}</Text>
              <Text
                style={[styles.badgeLabel, !awarded && styles.badgeLabelLocked]}
                numberOfLines={1}
              >
                {def.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
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
  title: {
    color: '#F5C518',
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  badge: {
    backgroundColor: '#F5C51815',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    width: '30%',
    borderWidth: 1,
    borderColor: '#F5C51830',
  },
  badgeLocked: {
    backgroundColor: '#1E1E1E',
    borderColor: '#2A2A2A',
    opacity: 0.4,
  },
  badgeEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  badgeLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  badgeLabelLocked: {
    color: '#666666',
  },
});
