import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { ActivityLog } from '../types/partner';
import { daysSince } from '../utils/date';

const MASCOT_GRUMPY = require('../../assets/mascot/grumpymascot.png');

// ─── Fumble Risk Calculation ────────────────────────────────────────────────

export type FumbleRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

/**
 * Calculate overall fumble risk based on activity gaps.
 *
 * Rules:
 *   Compliment > 5 days OR Date > 14 days → HIGH
 *   Compliment > 3 days OR Date > 10 days → MEDIUM
 *   Otherwise → LOW
 */
export function calculateFumbleRisk(log: ActivityLog): FumbleRiskLevel {
  const compDays = daysSince(log.lastCompliment);
  const dateDays = daysSince(log.lastDate);

  if (compDays > 5 || dateDays > 14) return 'HIGH';
  if (compDays > 3 || dateDays > 10) return 'MEDIUM';
  return 'LOW';
}

// ─── Component ──────────────────────────────────────────────────────────────

interface FumbleRiskMeterProps {
  risk: FumbleRiskLevel;
}

const RISK_CONFIG = {
  LOW: { color: '#4CAF50', label: 'Low Risk', emoji: '✅', barPercent: 33 },
  MEDIUM: { color: '#FF8C00', label: 'Medium Risk', emoji: '⚠️', barPercent: 66 },
  HIGH: { color: '#FF4444', label: 'High Risk', emoji: '🚨', barPercent: 100 },
} as const;

export default function FumbleRiskMeter({ risk }: FumbleRiskMeterProps) {
  const config = RISK_CONFIG[risk];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {risk === 'HIGH' && (
            <Image source={MASCOT_GRUMPY} style={styles.riskMascot} resizeMode="contain" />
          )}
          <Text style={styles.title}>Fumble Risk</Text>
        </View>
        <Text style={[styles.riskLabel, { color: config.color }]}>
          {config.emoji} {config.label}
        </Text>
      </View>
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            { width: `${config.barPercent}%`, backgroundColor: config.color },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#161616',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  riskMascot: {
    width: 22,
    height: 22,
  },
  title: {
    color: '#999999',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  riskLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  barTrack: {
    width: '100%',
    height: 6,
    backgroundColor: '#2A2A2A',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
});
