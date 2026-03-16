/**
 * ToneSelectorCard — lets PRO users pick a suggestion pack / tone.
 * Free users see the packs but locked ones open the paywall.
 */
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { TEMPLATE_PACKS, PackId, TemplatePack } from '../config/templatePacks';
import { PaywallReason } from '../services/paywall';

interface ToneSelectorCardProps {
  isPro: boolean;
  selectedPackId: PackId;
  onSelect: (packId: PackId) => void;
  onPaywallTrigger: (reason: PaywallReason) => void;
}

export default function ToneSelectorCard({
  isPro,
  selectedPackId,
  onSelect,
  onPaywallTrigger,
}: ToneSelectorCardProps) {
  const handlePress = (pack: TemplatePack) => {
    if (pack.isPremium && !isPro) {
      onPaywallTrigger('general');
      return;
    }
    onSelect(pack.id);
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>Tone / Pack</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {TEMPLATE_PACKS.map((pack) => {
          const isSelected = selectedPackId === pack.id;
          const isLocked = pack.isPremium && !isPro;
          return (
            <TouchableOpacity
              key={pack.id}
              style={[
                styles.chip,
                isSelected && styles.chipSelected,
                isLocked && styles.chipLocked,
              ]}
              onPress={() => handlePress(pack)}
              activeOpacity={0.7}
            >
              <Text style={styles.chipEmoji}>{pack.emoji}</Text>
              <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>
                {pack.label}
              </Text>
              {isLocked && <Text style={styles.lockIcon}>🔒</Text>}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  label: {
    color: '#999999',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#161616',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  chipSelected: {
    borderColor: '#F5C518',
    backgroundColor: '#F5C51815',
  },
  chipLocked: {
    opacity: 0.55,
  },
  chipEmoji: {
    fontSize: 14,
  },
  chipLabel: {
    color: '#999999',
    fontSize: 13,
    fontWeight: '600',
  },
  chipLabelSelected: {
    color: '#F5C518',
  },
  lockIcon: {
    fontSize: 10,
    marginLeft: 2,
  },
});
