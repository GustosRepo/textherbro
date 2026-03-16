import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from 'react-native';

const MASCOT_THUMBSUP = require('../../assets/mascot/thumbsupmascot.png');
import { PREMIUM_FEATURES, PRICING, PricingTier } from '../config/premiumFeatures';
import {
  PaywallReason,
  getPaywallCopy,
  purchasePremium,
  restorePurchases,
} from '../services/paywall';
import { trackEvent } from '../services/analytics';

interface PaywallModalProps {
  visible: boolean;
  reason: PaywallReason;
  onClose: () => void;
  onPurchased: () => void;
}

export default function PaywallModal({
  visible,
  reason,
  onClose,
  onPurchased,
}: PaywallModalProps) {
  const copy = getPaywallCopy(reason);

  useEffect(() => {
    if (visible) {
      trackEvent('paywall_shown', { reason });
    }
  }, [visible, reason]);

  const handlePurchase = async (tier: PricingTier) => {
    const result = await purchasePremium(tier);
    if (result.success) {
      Alert.alert('Welcome, King 👑', result.message);
      onPurchased();
      onClose();
    } else {
      Alert.alert('Error', result.message);
    }
  };

  const handleRestore = async () => {
    const result = await restorePurchases();
    if (result.success) {
      Alert.alert('Restored 👑', result.message);
      onPurchased();
      onClose();
    } else {
      Alert.alert('Nothing found', result.message);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.content}>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>

            <Image source={MASCOT_THUMBSUP} style={styles.paywallMascot} resizeMode="contain" />
            <Text style={styles.brand}>TEXT HER BRO</Text>
            <View style={styles.premiumBadgeWrap}>
              <Text style={styles.premiumBadge}>PREMIUM</Text>
            </View>
            <Text style={styles.title}>{copy.title}</Text>
            <Text style={styles.subtitle}>{copy.subtitle}</Text>

            {/* Features */}
            <View style={styles.features}>
              {PREMIUM_FEATURES.map((f) => (
                <View key={f.key} style={styles.featureRow}>
                  <Text style={styles.featureEmoji}>{f.emoji}</Text>
                  <View style={styles.featureText}>
                    <Text style={styles.featureLabel}>{f.label}</Text>
                    <Text style={styles.featureDesc}>{f.description}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Pricing — Annual highlighted as best deal */}
            <TouchableOpacity
              style={[styles.priceBtn, styles.priceBtnHighlight]}
              onPress={() => handlePurchase('annual')}
            >
              <Text style={styles.priceBtnLabel}>Annual</Text>
              <Text style={styles.priceAmt}>{PRICING.annual.price}/yr</Text>
              <Text style={styles.priceNote}>Save {PRICING.annual.savings}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.priceBtn}
              onPress={() => handlePurchase('monthly')}
            >
              <Text style={styles.priceBtnLabel}>Monthly</Text>
              <Text style={styles.priceAmt}>{PRICING.monthly.price}/mo</Text>
            </TouchableOpacity>

            {/* Restore */}
            <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore}>
              <Text style={styles.restoreBtnText}>Restore Purchases</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#0A0A0A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    borderWidth: 1,
    borderColor: '#F5C51830',
    borderBottomWidth: 0,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  paywallMascot: {
    width: 80,
    height: 80,
    alignSelf: 'center',
    marginBottom: 8,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  closeBtnText: {
    color: '#666666',
    fontSize: 20,
  },
  brand: {
    color: '#F5C518',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 6,
    textAlign: 'center',
    marginBottom: 8,
  },
  premiumBadgeWrap: {
    alignItems: 'center',
    marginBottom: 20,
  },
  premiumBadge: {
    color: '#0A0A0A',
    backgroundColor: '#F5C518',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 4,
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 8,
    overflow: 'hidden',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#999999',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  features: {
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureEmoji: {
    fontSize: 20,
    marginRight: 12,
    width: 28,
    textAlign: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  featureDesc: {
    color: '#666666',
    fontSize: 12,
    marginTop: 2,
  },
  priceBtn: {
    backgroundColor: '#161616',
    borderRadius: 14,
    padding: 18,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  priceBtnHighlight: {
    borderColor: '#F5C518',
    backgroundColor: '#F5C51810',
  },
  priceBtnLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  priceAmt: {
    color: '#F5C518',
    fontSize: 20,
    fontWeight: '900',
  },
  priceNote: {
    color: '#999999',
    fontSize: 12,
    marginTop: 2,
  },
  restoreBtn: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  restoreBtnText: {
    color: '#666666',
    fontSize: 13,
    fontWeight: '600',
  },
});
