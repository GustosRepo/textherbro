/**
 * Relationship Analytics — PRO Only
 *
 * Shows: compliments sent, check-ins, dates planned, current/longest streak,
 * fumble count, score trend, and activity breakdown.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getHistory, getActivityLog } from '../services/storage';
import { getScoreHistory, getScoreTrend, ScoreTrend, ScoreSnapshot } from '../services/scoreHistory';
import { getAnalyticsSummary, AnalyticsSummary } from '../services/analytics';
import { isPremium } from '../services/premium';
import { ActivityLog, ActivityHistoryEntry } from '../types/partner';
import { daysAgoLabel } from '../utils/date';
import PaywallModal from '../components/PaywallModal';
import { PaywallReason } from '../services/paywall';

const MASCOT_REFLECTING = require('../../assets/mascot/relfectingmascot.png');

interface StatRowProps {
  emoji: string;
  label: string;
  value: string | number;
  color?: string;
}

function StatRow({ emoji, label, value, color = '#FFFFFF' }: StatRowProps) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

export default function AnalyticsScreen() {
  const [isPro, setIsPro] = useState(false);
  const [log, setLog] = useState<ActivityLog | null>(null);
  const [history, setHistory] = useState<ActivityHistoryEntry[]>([]);
  const [trend, setTrend] = useState<ScoreTrend | null>(null);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [scoreHistory, setScoreHistory] = useState<ScoreSnapshot[]>([]);
  const [paywallVisible, setPaywallVisible] = useState(false);

  const loadData = useCallback(async () => {
    const premium = await isPremium();
    setIsPro(premium);

    if (!premium) return;

    const [activityLog, hist, scoreTrend, analyticsSummary, scoreHist] = await Promise.all([
      getActivityLog(),
      getHistory(),
      getScoreTrend(),
      getAnalyticsSummary(),
      getScoreHistory(),
    ]);

    setLog(activityLog);
    setHistory(hist);
    setTrend(scoreTrend);
    setSummary(analyticsSummary);
    setScoreHistory(scoreHist);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  // Gate for non-pro users
  if (!isPro) {
    return (
      <View style={styles.lockedContainer}>
        <Image source={MASCOT_REFLECTING} style={styles.lockedMascot} resizeMode="contain" />
        <Text style={styles.lockedTitle}>Boyfriend Performance</Text>
        <Text style={styles.lockedSubtitle}>
          Unlock analytics to see your relationship stats, score trends, and fumble history.
        </Text>
        <TouchableOpacity
          style={styles.unlockBtn}
          onPress={() => setPaywallVisible(true)}
        >
          <Text style={styles.unlockBtnText}>Unlock with PRO 👑</Text>
        </TouchableOpacity>

        <PaywallModal
          visible={paywallVisible}
          reason={'analytics' as PaywallReason}
          onClose={() => setPaywallVisible(false)}
          onPurchased={() => {
            setPaywallVisible(false);
            loadData();
          }}
        />
      </View>
    );
  }

  const totalCompliments = history.filter(h => h.type === 'compliment').length;
  const totalCheckIns = history.filter(h => h.type === 'checkIn').length;
  const totalDates = history.filter(h => h.type === 'date').length;
  const bestStreak = log ? Math.max(log.complimentStreak, log.checkInStreak, log.dateStreak) : 0;

  // Fumble count: days with no activity in history range
  const uniqueActiveDays = new Set(history.map(h => h.timestamp.slice(0, 10))).size;
  const oldestEntry = history.length > 0 ? history[history.length - 1].timestamp : null;
  const daysSinceStart = oldestEntry
    ? Math.ceil((Date.now() - new Date(oldestEntry).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const fumbleCount = Math.max(0, daysSinceStart - uniqueActiveDays);

  // Weekly report: last 7 days
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const thisWeekHistory = history.filter(h => new Date(h.timestamp).getTime() >= sevenDaysAgo);
  const weekCompliments = thisWeekHistory.filter(h => h.type === 'compliment').length;
  const weekCheckIns = thisWeekHistory.filter(h => h.type === 'checkIn').length;
  const weekDates = thisWeekHistory.filter(h => h.type === 'date').length;
  const weekActiveDays = new Set(thisWeekHistory.map(h => h.timestamp.slice(0, 10))).size;
  const weekFumbleDays = 7 - weekActiveDays;

  // Score history chart: last 14 snapshots
  const chartData = scoreHistory.slice(-14);
  const maxScore = chartData.length > 0 ? Math.max(...chartData.map(s => s.score), 1) : 100;

  const trendArrow = trend?.direction === 'up' ? '📈' : trend?.direction === 'down' ? '📉' : '➡️';
  const trendColor = trend?.direction === 'up' ? '#4CAF50' : trend?.direction === 'down' ? '#FF4444' : '#999999';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Boyfriend Performance</Text>
      <Text style={styles.subtitle}>Your relationship at a glance, king.</Text>

      {/* Score Trend */}
      {trend && (
        <View style={styles.trendCard}>
          <Text style={styles.trendLabel}>Score Trend (7 days)</Text>
          <View style={styles.trendRow}>
            <Text style={[styles.trendScore, { color: trendColor }]}>
              {trend.current}
            </Text>
            <Text style={styles.trendArrow}>{trendArrow}</Text>
            <Text style={[styles.trendChange, { color: trendColor }]}>
              {trend.change > 0 ? '+' : ''}{trend.change} from last week
            </Text>
          </View>
        </View>
      )}

      {/* Score History Chart */}
      {chartData.length > 1 && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Score History (14 days)</Text>
          <View style={styles.chartContainer}>
            {chartData.map((snap, i) => {
              const barHeight = Math.max(4, Math.round((snap.score / maxScore) * 60));
              const barColor = snap.score >= 70 ? '#4CAF50' : snap.score >= 40 ? '#F5C518' : '#FF4444';
              const dayLabel = snap.date.slice(5); // MM-DD
              return (
                <View key={snap.date} style={styles.chartBar}>
                  <Text style={styles.chartScore}>{snap.score}</Text>
                  <View style={[styles.chartBarFill, { height: barHeight, backgroundColor: barColor }]} />
                  <Text style={styles.chartDay}>{dayLabel}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Weekly Report */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Weekly Report</Text>
        <StatRow emoji="😍" label="Compliments This Week" value={weekCompliments} color="#F5C518" />
        <StatRow emoji="💬" label="Check-ins This Week" value={weekCheckIns} color="#F5C518" />
        <StatRow emoji="🌹" label="Dates This Week" value={weekDates} color="#F5C518" />
        <StatRow emoji="✅" label="Active Days" value={`${weekActiveDays}/7`} color="#4CAF50" />
        <StatRow
          emoji="💀"
          label="Fumble Days"
          value={weekFumbleDays}
          color={weekFumbleDays === 0 ? '#4CAF50' : weekFumbleDays <= 2 ? '#F5C518' : '#FF4444'}
        />
        {trend && (
          <StatRow
            emoji={trendArrow}
            label="Score Change"
            value={`${trend.change > 0 ? '+' : ''}${trend.change}`}
            color={trendColor}
          />
        )}
      </View>

      {/* Activity Stats */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Activity Breakdown</Text>
        <StatRow emoji="😍" label="Compliments Sent" value={totalCompliments} color="#F5C518" />
        <StatRow emoji="💬" label="Check-ins Sent" value={totalCheckIns} color="#F5C518" />
        <StatRow emoji="🌹" label="Dates Planned" value={totalDates} color="#F5C518" />
        <StatRow emoji="📋" label="Total Actions" value={summary?.totalActivities ?? 0} />
      </View>

      {/* Streak Stats */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Streaks</Text>
        <StatRow emoji="🔥" label="Current Best Streak" value={`${bestStreak} days`} color="#FF8C00" />
        <StatRow emoji="🏆" label="Longest Streak Ever" value={`${log?.longestStreak ?? 0} days`} color="#F5C518" />
        <StatRow emoji="😍" label="Compliment Streak" value={`${log?.complimentStreak ?? 0} days`} />
        <StatRow emoji="💬" label="Check-in Streak" value={`${log?.checkInStreak ?? 0} days`} />
        <StatRow emoji="🌹" label="Date Streak" value={`${log?.dateStreak ?? 0} sessions`} />
      </View>

      {/* Fumble Stats */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Fumble Report</Text>
        <StatRow emoji="💀" label="Total Fumble Days" value={fumbleCount} color="#FF4444" />
        <StatRow emoji="📱" label="Suggestions Copied" value={summary?.totalCopied ?? 0} color="#4CAF50" />
        <StatRow emoji="⏭️" label="Suggestions Skipped" value={summary?.totalSkipped ?? 0} color="#999999" />
      </View>

      {/* App Usage */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>App Usage</Text>
        <StatRow emoji="📂" label="App Opens" value={summary?.totalOpens ?? 0} />
        <StatRow emoji="📝" label="Notes Added" value={summary?.totalNotesAdded ?? 0} />
      </View>

      {/* Recent Activity */}
      {history.length > 0 && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {history.slice(0, 15).map((entry) => (
            <View key={entry.id} style={styles.historyRow}>
              <Text style={styles.historyEmoji}>
                {entry.type === 'compliment' ? '😍' : entry.type === 'checkIn' ? '💬' : '🌹'}
              </Text>
              <Text style={styles.historyLabel}>
                {entry.type === 'compliment' ? 'Compliment sent' : entry.type === 'checkIn' ? 'Checked in' : 'Date logged'}
              </Text>
              <Text style={styles.historyTime}>
                {daysAgoLabel(entry.timestamp)}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    color: '#666666',
    fontSize: 15,
    marginBottom: 24,
  },
  // Trend Card
  trendCard: {
    backgroundColor: '#161616',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F5C51830',
  },
  trendLabel: {
    color: '#999999',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 10,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  trendScore: {
    fontSize: 48,
    fontWeight: '900',
  },
  trendArrow: {
    fontSize: 24,
  },
  trendChange: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Score History Chart
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 8,
    height: 100,
    gap: 3,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
  },
  chartBarFill: {
    width: '100%',
    borderRadius: 3,
    minHeight: 4,
  },
  chartScore: {
    color: '#666666',
    fontSize: 8,
    fontWeight: '700',
  },
  chartDay: {
    color: '#444444',
    fontSize: 7,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Section Cards
  sectionCard: {
    backgroundColor: '#161616',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  sectionTitle: {
    color: '#F5C518',
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 14,
  },
  // Stat Rows
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E1E',
  },
  statEmoji: {
    fontSize: 18,
    marginRight: 12,
    width: 28,
    textAlign: 'center',
  },
  statLabel: {
    flex: 1,
    color: '#999999',
    fontSize: 14,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  // Recent Activity
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E1E',
  },
  historyEmoji: {
    fontSize: 18,
    marginRight: 12,
    width: 28,
    textAlign: 'center',
  },
  historyLabel: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  historyTime: {
    color: '#666666',
    fontSize: 12,
  },
  // Locked State
  lockedContainer: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  lockedMascot: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  lockedTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 10,
    textAlign: 'center',
  },
  lockedSubtitle: {
    color: '#666666',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  unlockBtn: {
    backgroundColor: '#F5C518',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
  },
  unlockBtnText: {
    color: '#0A0A0A',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
