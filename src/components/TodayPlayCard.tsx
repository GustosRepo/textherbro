import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

const MASCOT_THINKING = require('../../assets/mascot/thinkingmascot.png');
import * as Clipboard from 'expo-clipboard';
import SuggestionRow from './SuggestionRow';
import { Suggestions, pickSuggestion } from '../services/suggestions';
import { canRefreshSuggestion, incrementRefreshCount, RefreshCategory } from '../services/premium';
import { trackEvent } from '../services/analytics';
import { PaywallReason } from '../services/paywall';

interface TodayPlayCardProps {
  suggestions: Suggestions;
  onMarkDone: (type: 'compliment' | 'checkIn' | 'date') => void;
  onCopied: () => void;
  onPaywallTrigger: (reason: PaywallReason) => void;
}

export default function TodayPlayCard({
  suggestions,
  onMarkDone,
  onCopied,
  onPaywallTrigger,
}: TodayPlayCardProps) {
  const [complimentIdx, setComplimentIdx] = useState(0);
  const [checkInIdx, setCheckInIdx] = useState(0);
  const [dateIdx, setDateIdx] = useState(0);

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

  const complimentText = pickSuggestion(suggestions.compliments, complimentIdx);
  const checkInText = pickSuggestion(suggestions.checkIns, checkInIdx);
  const dateText = pickSuggestion(suggestions.dateIdeas, dateIdx);

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
      />

      <SuggestionRow
        label="Check-in to send"
        emoji="💬"
        text={checkInText}
        onCopy={() => copy(checkInText)}
        onNext={() => handleRefresh('checkIn', setCheckInIdx)}
        onDone={() => onMarkDone('checkIn')}
      />

      <SuggestionRow
        label="Date idea"
        emoji="🌹"
        text={dateText}
        onCopy={() => copy(dateText)}
        onNext={() => handleRefresh('dateIdea', setDateIdx)}
        onDone={() => onMarkDone('date')}
      />
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
});
