/**
 * SOS Screen — Emergency relationship recovery mode.
 * PRO only.
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { getSOSPlan, SOS_SCENARIOS, SOSScenario, SOSStep } from '../services/sos';
import { trackEvent } from '../services/analytics';
import { canUseSOS } from '../services/premium';
import PaywallModal from '../components/PaywallModal';

function StepCard({ step }: { step: SOSStep }) {
  const copyMessage = async () => {
    if (!step.message) return;
    await Clipboard.setStringAsync(step.message);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Copied 📋', 'Text copied. Go send it, king.');
  };

  return (
    <View style={styles.stepCard}>
      <View style={styles.stepHeader}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepNum}>{step.step}</Text>
        </View>
        <Text style={styles.stepTiming}>{step.timing}</Text>
        <Text style={styles.stepEmoji}>{step.emoji}</Text>
      </View>
      <Text style={styles.stepAction}>{step.action}</Text>
      {step.message && (
        <View style={styles.messageBubble}>
          <Text style={styles.messageText}>"{step.message}"</Text>
          <TouchableOpacity style={styles.copyBtn} onPress={copyMessage}>
            <Text style={styles.copyBtnText}>Copy</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function SOSScreen() {
  const [selected, setSelected] = useState<SOSScenario | null>(null);
  const [isPro, setIsPro] = useState<boolean | null>(null);
  const [paywallVisible, setPaywallVisible] = useState(false);

  useEffect(() => {
    canUseSOS().then(setIsPro);
  }, []);

  const handleSelect = (id: SOSScenario) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelected(id);
    trackEvent('sos_scenario_selected', { scenario: id });
  };

  const plan = selected ? getSOSPlan(selected) : null;

  // Still checking premium status
  if (isPro === null) return <View style={styles.container} />;

  // Not premium — show locked state with paywall
  if (!isPro) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
        <Text style={{ fontSize: 56, marginBottom: 16 }}>🆘</Text>
        <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: 12 }}>
          SOS Mode
        </Text>
        <Text style={{ color: '#666666', fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 32 }}>
          Emergency relationship recovery plans. Step-by-step playbooks for when things go sideways.
        </Text>
        <TouchableOpacity
          style={{ backgroundColor: '#F5C518', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 32, width: '100%', alignItems: 'center' }}
          onPress={() => setPaywallVisible(true)}
          activeOpacity={0.85}
        >
          <Text style={{ color: '#0A0A0A', fontSize: 16, fontWeight: '900' }}>Unlock SOS Mode 🔓</Text>
        </TouchableOpacity>
        <PaywallModal
          visible={paywallVisible}
          reason="sos_mode"
          onClose={() => setPaywallVisible(false)}
          onPurchased={() => canUseSOS().then(setIsPro)}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>🆘 SOS Mode</Text>
      <Text style={styles.subtitle}>
        Relationship on the ropes? Pick your situation and follow the plan. Don't improvise.
      </Text>

      {/* Scenario selector */}
      <View style={styles.scenarioGrid}>
        {SOS_SCENARIOS.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={[styles.scenarioCard, selected === s.id && styles.scenarioCardSelected]}
            onPress={() => handleSelect(s.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.scenarioEmoji}>{s.emoji}</Text>
            <Text style={[styles.scenarioLabel, selected === s.id && styles.scenarioLabelSelected]}>
              {s.label}
            </Text>
            <Text style={styles.scenarioDesc}>{s.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recovery Plan */}
      {plan && (
        <View style={styles.planContainer}>
          <View style={[styles.urgencyBadge, styles[`urgency_${plan.urgency}`]]}>
            <Text style={styles.urgencyText}>
              {plan.urgency === 'high' ? '🚨 HIGH ALERT' : plan.urgency === 'medium' ? '⚠️ ACT NOW' : '✅ MANAGEABLE'}
            </Text>
          </View>

          <Text style={styles.planTitle}>{plan.title}</Text>
          <Text style={styles.planSubtitle}>{plan.subtitle}</Text>

          <Text style={styles.stepsLabel}>RECOVERY PLAN</Text>
          {plan.steps.map((step) => (
            <StepCard key={step.step} step={step} />
          ))}

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              You got this, king. Execute the plan. Don't freestyle.
            </Text>
          </View>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  content: { padding: 20, paddingTop: 60 },
  title: { color: '#FFFFFF', fontSize: 28, fontWeight: '900', marginBottom: 8 },
  subtitle: { color: '#666666', fontSize: 14, lineHeight: 20, marginBottom: 24 },

  scenarioGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  scenarioCard: {
    width: '47.5%',
    backgroundColor: '#161616',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  scenarioCardSelected: { borderColor: '#FF4444', backgroundColor: '#FF444410' },
  scenarioEmoji: { fontSize: 28, marginBottom: 8 },
  scenarioLabel: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', marginBottom: 4 },
  scenarioLabelSelected: { color: '#FF4444' },
  scenarioDesc: { color: '#666666', fontSize: 12 },

  planContainer: { marginTop: 8 },
  urgencyBadge: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start', marginBottom: 14 },
  urgency_high: { backgroundColor: '#FF444420', borderWidth: 1, borderColor: '#FF4444' },
  urgency_medium: { backgroundColor: '#F5C51820', borderWidth: 1, borderColor: '#F5C518' },
  urgency_low: { backgroundColor: '#4CAF5020', borderWidth: 1, borderColor: '#4CAF50' },
  urgencyText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900', letterSpacing: 1 },

  planTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', marginBottom: 8 },
  planSubtitle: { color: '#999999', fontSize: 14, lineHeight: 20, marginBottom: 20 },
  stepsLabel: { color: '#F5C518', fontSize: 11, fontWeight: '800', letterSpacing: 2, marginBottom: 12, textTransform: 'uppercase' },

  stepCard: {
    backgroundColor: '#161616',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  stepHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  stepBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#F5C518', alignItems: 'center', justifyContent: 'center',
  },
  stepNum: { color: '#0A0A0A', fontSize: 13, fontWeight: '900' },
  stepTiming: { flex: 1, color: '#F5C518', fontSize: 12, fontWeight: '700' },
  stepEmoji: { fontSize: 18 },
  stepAction: { color: '#FFFFFF', fontSize: 14, lineHeight: 20 },
  messageBubble: {
    backgroundColor: '#0A0A0A',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#333333',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  messageText: { flex: 1, color: '#FFFFFF', fontSize: 14, fontStyle: 'italic', lineHeight: 20 },
  copyBtn: {
    backgroundColor: '#F5C518',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  copyBtnText: { color: '#0A0A0A', fontSize: 12, fontWeight: '900' },

  footer: { marginTop: 16, padding: 16, backgroundColor: '#161616', borderRadius: 14, borderWidth: 1, borderColor: '#F5C51830' },
  footerText: { color: '#F5C518', fontSize: 14, fontWeight: '700', textAlign: 'center' },
});
