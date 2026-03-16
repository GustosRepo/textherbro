import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';

const MASCOT_THINKING = require('../../assets/mascot/thinkingmascot.png');
import * as Clipboard from 'expo-clipboard';
import SuggestionRow from './SuggestionRow';
import { Suggestions, pickSuggestion } from '../services/suggestions';
import { canRefreshSuggestion, incrementRefreshCount, RefreshCategory } from '../services/premium';
import { trackEvent } from '../services/analytics';
import { PaywallReason } from '../services/paywall';
import { saveLine } from '../services/storage';

interface TodayPlayCardProps {
  suggestions: Suggestions;
  isPro?: boolean;
  onMarkDone: (type: 'compliment' | 'checkIn' | 'date') => void;
  onCopied: () => void;
  onPaywallTrigger: (reason: PaywallReason) => void;
}

export default function TodayPlayCard({
  suggestions,
  isPro = false,
  onMarkDone,
  onCopied,
  onPaywallTrigger,
}: TodayPlayCardProps) {
  const [complimentIdx, setComplimentIdx] = useState(0);
  const [checkInIdx, setCheckInIdx] = useState(0);
  const [dateIdx, setDateIdx] = useState(0);
  const [deepIdx, setDeepIdx] = useState(0);

  // Reset to index 0 whenever suggestions are regenerated (e.g. pack switch)
  // so the first line shown is always the pack-specific one.
  useEffect(() => {
    setComplimentIdx(0);
    setCheckInIdx(0);
    setDateIdx(0);
    setDeepIdx(0);
  }, [suggestions]);

  const copy = useCallback(async (text: string) => {
    await Clipboard.setStringAsync(text);
    onCopied();
    trackEvent('suggestion_copied', { text: text.slice(0, 50) });
  }, [onCopied]);

  const handleRefresh = async (
    category: RefreshCategory,
    setter: React.Dispatch<React.SetStateAction<number>>,
  ) => {
    const allowed = await canRefreshSuggestion(category);
    if (!allowed) {
      onPaywallTrigger('unlimited_suggestions');
      trackEvent('suggestion_skipped', { category, blocked: true });
      return;
    }
    await incrementRefreshCount(category);
    trackEvent('suggestion_skipped', { category });
    setter((i) => i + 1);
  };

  const handleSave = async (text: string, category: 'compliment' | 'checkIn' | 'dateIdea' | 'deep') => {
    await saveLine(text, category === 'dateIdea' ? 'dateIdea' : category);
    onCopied(); // reuse the toast for "Saved!"
    trackEvent('line_saved', { category });
  };

  const complimentText = pickSuggestion(suggestions.compliments, complimentIdx);
  const checkInText = pickSuggestion(suggestions.checkIns, checkInIdx);
  const dateText = pickSuggestion(suggestions.dateIdeas, dateIdx);
  const deepText = pickSuggestion(suggestions.deepQuestions ?? [], deepIdx);

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Image source={MASCOT_THINKING} style={styles.titleMascot} resizeMode="contain" />
        <Text style={styles.title}>Today's Play</Text>
      </View>
      <Text style={styles.subtitle}>Your daily playbook. Copy, send, score points.</Text>

      <View style={styles.divider} />

      <SuggestionRow
        label="Compliment to send"
        emoji="😍"
        text={complimentText}
        onCopy={() => copy(complimentText)}
        onNext={() => handleRefresh('compliment', setComplimentIdx)}
        onDone={() => onMarkDone('compliment')}
        onSave={isPro ? () => handleSave(complimentText, 'compliment') : undefined}
      />

      <SuggestionRow
        label="Check-in to send"
        emoji="💬"
        text={checkInText}
        onCopy={() => copy(checkInText)}
        onNext={() => handleRefresh('checkIn', setCheckInIdx)}
        onDone={() => onMarkDone('checkIn')}
        onSave={isPro ? () => handleSave(checkInText, 'checkIn') : undefined}
      />

      <SuggestionRow
        label="Date idea"
        emoji="🌹"
        text={dateText}
        onCopy={() => copy(dateText)}
        onNext={() => handleRefresh('dateIdea', setDateIdx)}
        onDone={() => onMarkDone('date')}
        onSave={isPro ? () => handleSave(dateText, 'dateIdea') : undefined}
      />

      {/* Deep Question row — PRO only */}
      <View style={styles.deepDivider} />
      {isPro ? (
        <SuggestionRow
          label="Deep question"
          emoji="🧠"
          text={deepText}
          onCopy={() => copy(deepText)}
          onNext={() => setDeepIdx((i) => i + 1)}
          onDone={() => {}}
          onSave={() => handleSave(deepText, 'deep')}
        />
      ) : (
        <TouchableOpacity style={styles.deepLocked} onPress={() => onPaywallTrigger('deep_questions')} activeOpacity={0.8}>
          <Text style={styles.deepLockedEmoji}>🧠</Text>
          <View style={styles.deepLockedTextWrap}>
            <Text style={styles.deepLockedTitle}>Deep Question</Text>
            <Text style={styles.deepLockedSub}>Spark real conversations. PRO only.</Text>
          </View>
          <View style={styles.deepLockBadge}><Text style={styles.deepLockText}>🔒 PRO</Text></View>
        </TouchableOpacity>
      )}
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleMascot: {
    width: 28,
    height: 28,
  },
  title: {
    color: '#F5C518',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: '#666666',
    fontSize: 13,
    marginTop: 4,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: '#2A2A2A',
    marginBottom: 14,
  },
  deepDivider: {
    height: 1,
    backgroundColor: '#2A2A2A',
    marginTop: 4,
    marginBottom: 14,
  },
  deepLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  deepLockedEmoji: { fontSize: 22 },
  deepLockedTextWrap: { flex: 1 },
  deepLockedTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  deepLockedSub: { color: '#666666', fontSize: 12, marginTop: 2 },
  deepLockBadge: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#333333',
  },
  deepLockText: { color: '#F5C518', fontSize: 11, fontWeight: '800' },
});
