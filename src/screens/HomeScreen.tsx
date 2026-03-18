import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Image,
} from 'react-native';

const MASCOT_MAIN = require('../../assets/mascot/mainmascot.png');
const MASCOT_FULLBODY = require('../../assets/mascot/fullbodymascot.png');
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';
import ScoreCard from '../components/ScoreCard';
import StreakCard from '../components/StreakCard';
import TodayPlayCard from '../components/TodayPlayCard';
import ToneSelectorCard from '../components/ToneSelectorCard';
import FumbleAlertsCard from '../components/FumbleAlertsCard';
import CountdownCard from '../components/CountdownCard';
import CopiedToast from '../components/CopiedToast';
import BadgeCard from '../components/BadgeCard';
import FumbleRiskMeter, { calculateFumbleRisk, FumbleRiskLevel } from '../components/FumbleRiskMeter';
import PaywallModal from '../components/PaywallModal';
import InsightsCard, { InsightsCardLocked } from '../components/InsightsCard';
import PartnerSwitcherCard from '../components/PartnerSwitcherCard';
import {
  getActivityLog,
  logActivity,
  calculateScore,
  getPartner,
  getNoteEntries,
  getFumbleAlerts,
  getHistory,
  getAllPartners,
  getActivePartnerId,
  setActivePartnerId,
  deletePartner,
  FumbleAlert,
} from '../services/storage';
import { daysAgoLabel, pickOne, daysUntilAnnual, daysSince } from '../utils/date';
import { generateSuggestions, Suggestions } from '../services/suggestions';
import { ActivityLog, Partner, ActivityHistoryEntry, NoteEntry } from '../types/partner';
import { AwardedBadge, checkAndAwardBadges } from '../services/badges';
import { recordDailyScore } from '../services/scoreHistory';
import { trackEvent } from '../services/analytics';
import { PaywallReason } from '../services/paywall';
import { shouldShowStreakPaywall, markStreakPaywallShown, maybeRequestReview } from '../services/engagement';
import type { PackId } from '../config/templatePacks';
import { syncWidget } from '../services/widget';

const EMPTY_SUGGESTIONS: Suggestions = {
  compliments: [],
  checkIns: [],
  dateIdeas: [],
  deepQuestions: [],
};

const GREETINGS = [
  (name: string) => `How you treating ${name}?`,
  (name: string) => `Don't fumble ${name} today.`,
  (name: string) => `${name} deserves better. Prove you're it.`,
  (name: string) => `Still got ${name}? Let's keep it that way.`,
  (name: string) => `${name}'s waiting on you, bro.`,
  (name: string) => `Make ${name} smile today or what?`,
  (name: string) => `You texted ${name} yet? Exactly.`,
  (name: string) => `Step up for ${name}. Clock's ticking.`,
];

const getGreeting = (name: string) => {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000,
  );
  return GREETINGS[dayOfYear % GREETINGS.length](name);
};

export default function HomeScreen({ navigation }: any) {
  const [log, setLog] = useState<ActivityLog | null>(null);
  const [score, setScore] = useState(0);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [allPartners, setAllPartners] = useState<Partner[]>([]);
  const [activePartnerId, setActivePartnerIdState] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestions>({ ...EMPTY_SUGGESTIONS, deepQuestions: [] });
  const [fumbles, setFumbles] = useState<FumbleAlert[]>([]);
  const [showCopied, setShowCopied] = useState(false);
  const [copiedKey, setCopiedKey] = useState(0);
  const [notes, setNotes] = useState<NoteEntry[]>([]);
  const [noteCount, setNoteCount] = useState(0);
  const [countdowns, setCountdowns] = useState<{ label: string; emoji: string; daysLeft: number }[]>([]);
  const [history, setHistory] = useState<ActivityHistoryEntry[]>([]);
  const [badges, setBadges] = useState<AwardedBadge[]>([]);
  const [fumbleRisk, setFumbleRisk] = useState<FumbleRiskLevel>('LOW');
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [paywallReason, setPaywallReason] = useState<PaywallReason>('general');
  const [isPro, setIsPro] = useState(false);
  const [selectedTone, setSelectedTone] = useState<PackId>('free');
  const [shieldCount, setShieldCount] = useState(0);

  const loadData = useCallback(async () => {
    const [activityLog, partnerData, noteEntries, historyData, partners, activeId] = await Promise.all([
      getActivityLog(),
      getPartner(),
      getNoteEntries(),
      getHistory(),
      getAllPartners(),
      getActivePartnerId(),
    ]);
    setLog(activityLog);
    setNoteCount(noteEntries.length);
    setNotes(noteEntries);
    setPartner(partnerData);
    setHistory(historyData);
    setAllPartners(partners);
    setActivePartnerIdState(activeId);

    const s = calculateScore(activityLog, notes.length);
    setScore(s);
    setFumbles(getFumbleAlerts(activityLog));
    setFumbleRisk(calculateFumbleRisk(activityLog));

    // Compute date proximity for suggestions + countdowns
    const birthdayDays = partnerData ? daysUntilAnnual(partnerData.birthday) : null;
    const anniversaryDays = partnerData ? daysUntilAnnual(partnerData.anniversary) : null;

    // Check premium status for template packs
    const {
      isPremium: checkPremium,
      getSelectedTone,
      getShieldCount,
    } = await import('../services/premium');
    const userIsPro = await checkPremium();
    const tone = await getSelectedTone();
    const shields = await getShieldCount();
    setIsPro(userIsPro);
    setSelectedTone(tone);
    setShieldCount(shields);

    setSuggestions(generateSuggestions(partnerData, noteEntries, {
      activityLog,
      birthdayDaysAway: birthdayDays,
      anniversaryDaysAway: anniversaryDays,
      isPro: userIsPro,
      selectedPackId: tone,
    }));

    // Badges
    const awarded = await checkAndAwardBadges(activityLog, noteEntries.length, historyData);
    setBadges(awarded);

    // Record daily score
    await recordDailyScore(s);

    // Sync widget data (iOS Home Screen widget)
    syncWidget();

    // Analytics
    trackEvent('app_open');

    // Build countdowns
    if (partnerData) {
      const items: { label: string; emoji: string; daysLeft: number }[] = [];
      if (birthdayDays !== null && birthdayDays <= 60) {
        items.push({
          label: birthdayDays === 0 ? `${partnerData.name}'s Birthday! 🥳` : `${partnerData.name}'s Birthday`,
          emoji: '🎂',
          daysLeft: birthdayDays,
        });
      }
      if (anniversaryDays !== null && anniversaryDays <= 60) {
        items.push({
          label: anniversaryDays === 0 ? 'Anniversary! 💍' : 'Anniversary',
          emoji: '💍',
          daysLeft: anniversaryDays,
        });
      }
      items.sort((a, b) => a.daysLeft - b.daysLeft);
      setCountdowns(items);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const handleLog = async (type: 'compliment' | 'checkIn' | 'date') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updated = await logActivity(type);
    setLog(updated);
    const s = calculateScore(updated, noteCount);
    setScore(s);
    setFumbles(getFumbleAlerts(updated));
    setFumbleRisk(calculateFumbleRisk(updated));
    trackEvent('activity_logged', { type });

    // Proactive paywall: show once when compliment streak hits 3+
    if (!isPro && updated.complimentStreak >= 3) {
      const show = await shouldShowStreakPaywall(updated.complimentStreak);
      if (show) {
        await markStreakPaywallShown();
        setPaywallReason('general');
        setPaywallVisible(true);
        return;
      }
    }

    // Review prompt: fire on 3-day streak milestones
    if (updated.complimentStreak === 3 || updated.checkInStreak === 3) {
      await maybeRequestReview();
    }
  };

  const handleCopied = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopiedKey((k) => k + 1);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 1800);
    trackEvent('suggestion_copied');
  };

  const handlePaywallTrigger = (reason: PaywallReason) => {
    setPaywallReason(reason);
    setPaywallVisible(true);
  };

  const handleToneSelect = async (packId: PackId) => {
    const { setSelectedTone: saveTone } = await import('../services/premium');
    await saveTone(packId);
    setSelectedTone(packId);
    // Regenerate suggestions with new tone
    if (partner) {
      const activityLog = await getActivityLog();
      const birthdayDays = daysUntilAnnual(partner.birthday);
      const anniversaryDays = daysUntilAnnual(partner.anniversary);
      setSuggestions(generateSuggestions(partner, notes, {
        activityLog,
        birthdayDaysAway: birthdayDays,
        anniversaryDaysAway: anniversaryDays,
        isPro,
        selectedPackId: packId,
      }));
    }
    trackEvent('tone_selected', { packId });
  };

  const handleUseShield = async (type: 'compliment' | 'checkIn' | 'date') => {
    const { applyShieldToStreak, getShieldCount } = await import('../services/premium');
    await applyShieldToStreak(type);
    const updated = await getActivityLog();
    setLog(updated);
    const remaining = await getShieldCount();
    setShieldCount(remaining);
    trackEvent('shield_used', { type });
  };

  const handleSwitchPartner = async (partnerId: string) => {
    await setActivePartnerId(partnerId);
    setActivePartnerIdState(partnerId);
    await loadData();
    trackEvent('partner_switched');
  };

  const handleDeletePartner = async (partnerId: string) => {
    await deletePartner(partnerId);
    await loadData();
    trackEvent('partner_deleted');
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (!partner) {
    return (
      <View style={styles.emptyContainer}>
        <Image source={MASCOT_FULLBODY} style={styles.emptyMascot} resizeMode="contain" />
        <Text style={styles.emptyTitle}>No partner added yet</Text>
        <Text style={styles.emptySubtitle}>
          Add your girl so we can keep you in check, bro.
        </Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('Partner')}
        >
          <Text style={styles.addButtonText}>Add Partner</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
      <CopiedToast key={copiedKey} visible={showCopied} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#F5C518"
          />
        }
      >
        <View style={styles.brandRow}>
          <Image source={MASCOT_MAIN} style={styles.brandMascot} resizeMode="contain" />
          <Text style={styles.brandHeader}>TEXT HER BRO</Text>
        </View>
        <Text style={styles.greeting}>
          {getGreeting(pickOne(partner.nickname || partner.name))}
        </Text>

        {/* Partner Switcher */}
        <PartnerSwitcherCard
          partners={allPartners}
          activePartnerId={activePartnerId}
          isPro={isPro}
          onSwitch={handleSwitchPartner}
          onAddNew={() => navigation.navigate('Partner')}
          onDeletePartner={handleDeletePartner}
          onUpgrade={() => handlePaywallTrigger('multi_partner')}
        />

        <ScoreCard score={score} />

        {/* Smart Insights */}
        {isPro && log ? (
          <InsightsCard partner={partner} notes={notes} log={log} onUpgrade={() => handlePaywallTrigger('smart_insights')} />
        ) : (
          <InsightsCardLocked onUpgrade={() => handlePaywallTrigger('smart_insights')} />
        )}

        {/* Fumble Risk Meter */}
        <FumbleRiskMeter risk={fumbleRisk} />

        {/* Badges */}
        <BadgeCard badges={badges} />

        {/* Countdowns */}
        <CountdownCard items={countdowns} />

        {/* Fumble Alerts */}
        <FumbleAlertsCard alerts={fumbles} />

        {/* Tone Selector */}
        <ToneSelectorCard
          isPro={isPro}
          selectedPackId={selectedTone}
          onSelect={handleToneSelect}
          onPaywallTrigger={handlePaywallTrigger}
        />

        {/* Today's Play */}
        <TodayPlayCard
          suggestions={suggestions}
          isPro={isPro}
          onMarkDone={handleLog}
          onCopied={handleCopied}
          onPaywallTrigger={handlePaywallTrigger}
        />

        {/* Quick Action Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleLog('compliment')}
          >
            <Text style={styles.actionEmoji}>😍</Text>
            <Text style={styles.actionLabel}>Compliment</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleLog('checkIn')}
          >
            <Text style={styles.actionEmoji}>💬</Text>
            <Text style={styles.actionLabel}>Check-in</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleLog('date')}
          >
            <Text style={styles.actionEmoji}>🌹</Text>
            <Text style={styles.actionLabel}>Date</Text>
          </TouchableOpacity>
        </View>

        {/* SOS Panic Button */}
        <TouchableOpacity
          style={[styles.sosButton, !isPro && styles.sosButtonLocked]}
          onPress={() => {
            if (!isPro) { handlePaywallTrigger('sos_mode'); return; }
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            navigation.navigate('SOS');
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.sosEmoji}>🆘</Text>
          <View style={styles.sosTextWrap}>
            <Text style={styles.sosTitle}>SOS Mode</Text>
            <Text style={styles.sosSub}>
              {isPro ? 'Emergency relationship recovery plan' : 'Get your recovery plan — PRO only'}
            </Text>
          </View>
          {!isPro && <Text style={styles.sosLockBadge}>🔒</Text>}
        </TouchableOpacity>

        {/* Milestones & Playbook quick access */}
        <View style={styles.quickNavRow}>
          <TouchableOpacity
            style={styles.quickNavBtn}
            onPress={() => navigation.navigate('Milestones')}
          >
            <Text style={styles.quickNavEmoji}>🏅</Text>
            <Text style={styles.quickNavLabel}>Milestones</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickNavBtn}
            onPress={() => {
              if (!isPro) { handlePaywallTrigger('saved_lines'); return; }
              navigation.navigate('Playbook');
            }}
          >
            <Text style={styles.quickNavEmoji}>📓</Text>
            <Text style={styles.quickNavLabel}>Playbook</Text>
            {!isPro && <Text style={styles.quickNavLock}>🔒</Text>}
          </TouchableOpacity>
        </View>

        {/* Streaks */}
        <Text style={styles.sectionTitle}>Streaks</Text>
        {log && (
          <>
            <StreakCard
              label="Compliments"
              emoji="😍"
              streak={log.complimentStreak}
              lastAction={daysAgoLabel(log.lastCompliment)}
              isShieldable={daysSince(log.lastCompliment) === 2 && log.complimentStreak > 0}
              shieldsAvailable={shieldCount}
              onUseShield={() => handleUseShield('compliment')}
            />
            <StreakCard
              label="Check-ins"
              emoji="💬"
              streak={log.checkInStreak}
              lastAction={daysAgoLabel(log.lastCheckIn)}
              isShieldable={daysSince(log.lastCheckIn) === 2 && log.checkInStreak > 0}
              shieldsAvailable={shieldCount}
              onUseShield={() => handleUseShield('checkIn')}
            />
            <StreakCard
              label="Dates"
              emoji="🌹"
              streak={log.dateStreak}
              lastAction={daysAgoLabel(log.lastDate)}
              isShieldable={daysSince(log.lastDate) === 2 && log.dateStreak > 0}
              shieldsAvailable={shieldCount}
              onUseShield={() => handleUseShield('date')}
            />
          </>
        )}

        {/* Recent Activity */}

        <View style={{ height: 40 }} />
      </ScrollView>

      <PaywallModal
        visible={paywallVisible}
        reason={paywallReason}
        onClose={() => setPaywallVisible(false)}
        onPurchased={() => loadData()}
      />
    </View>
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
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  brandMascot: {
    width: 32,
    height: 32,
  },
  brandHeader: {
    color: '#F5C518',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 6,
    textTransform: 'uppercase',
  },
  greeting: {
    color: '#999999',
    fontSize: 16,
    marginBottom: 20,
    fontWeight: '500',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#161616',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F5C51830',
  },
  actionEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  actionLabel: {
    color: '#F5C518',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  // Empty state
  emptyContainer: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyMascot: {
    width: 140,
    height: 140,
    marginBottom: 20,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  emptySubtitle: {
    color: '#666666',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  addButton: {
    backgroundColor: '#F5C518',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
  },
  addButtonText: {
    color: '#0A0A0A',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FF44441A',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    marginBottom: 4,
    borderWidth: 1.5,
    borderColor: '#FF4444',
  },
  sosButtonLocked: {
    borderColor: '#333333',
    backgroundColor: '#1A1A1A',
  },
  sosEmoji: { fontSize: 24 },
  sosTextWrap: { flex: 1 },
  sosTitle: { color: '#FF4444', fontSize: 15, fontWeight: '900' },
  sosSub: { color: '#999999', fontSize: 12, marginTop: 2 },
  sosLockBadge: { fontSize: 18 },
  quickNavRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    marginBottom: 4,
  },
  quickNavBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#161616',
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  quickNavEmoji: { fontSize: 20 },
  quickNavLabel: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  quickNavLock: { fontSize: 12 },
});
