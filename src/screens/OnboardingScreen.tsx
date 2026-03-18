/**
 * OnboardingScreen — Premium 4-step first-launch experience.
 *
 * Step 0: Welcome / Hook
 * Step 1: Partner setup (name + optional anniversary)
 * Step 2: Value reveal (personalized)
 * Step 3: Notifications soft-ask
 */
import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { addPartner } from '../services/storage';
import { registerForPushNotifications, scheduleReminders } from '../services/reminders';
import { trackEvent } from '../services/analytics';

const { width: SCREEN_W } = Dimensions.get('window');
const TOTAL_STEPS = 4;

const MASCOT_MAIN     = require('../../assets/mascot/mainmascot.png');
const MASCOT_THUMBSUP = require('../../assets/mascot/thumbsupmascot.png');
const MASCOT_CELEBRATE= require('../../assets/mascot/celebratingmascot.png');
const MASCOT_THINKING = require('../../assets/mascot/thinkingmascot.png');

interface Props {
  onComplete: () => void;
}

// ─── Dot indicator ────────────────────────────────────────────────────────────

function Dots({ step }: { step: number }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i === step && styles.dotActive,
            i < step && styles.dotDone,
          ]}
        />
      ))}
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function OnboardingScreen({ onComplete }: Props) {
  const [step, setStep]               = useState(0);
  const [partnerName, setPartnerName] = useState('');
  const [anniversary, setAnniversary] = useState<Date | null>(null);
  const [nameError, setNameError]     = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(1)).current;

  const animateToNext = useCallback((nextStep: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Slide out left + fade out
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -SCREEN_W * 0.3,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setStep(nextStep);
      slideAnim.setValue(SCREEN_W * 0.4);

      // Slide in from right + fade in
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 70,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [slideAnim, fadeAnim]);

  const handleNext = useCallback(async () => {
    if (step === 1) {
      if (!partnerName.trim()) {
        setNameError(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      setNameError(false);
    }

    if (step === TOTAL_STEPS - 1) {
      await handleFinish();
      return;
    }

    animateToNext(step + 1);
  }, [step, partnerName, animateToNext]);

  const handleFinish = async () => {
    // Create partner
    await addPartner({
      name: partnerName.trim() || 'Partner',
      nickname: '',
      birthday: '',
      anniversary: anniversary ? anniversary.toISOString() : '',
      favorites: {},
    });

    await trackEvent('onboarding_complete', { has_anniversary: !!anniversary });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onComplete();
  };

  const handleEnableNotifications = async () => {
    const status = await registerForPushNotifications();
    if (status === 'granted') {
      await scheduleReminders();
    }
    await handleFinish();
  };

  return (
    <View style={styles.root}>
      <Animated.View
        style={[
          styles.slide,
          { transform: [{ translateX: slideAnim }], opacity: fadeAnim },
        ]}
      >
        {step === 0 && <StepWelcome onNext={handleNext} />}
        {step === 1 && (
          <StepPartner
            name={partnerName}
            anniversary={anniversary}
            nameError={nameError}
            onChangeName={(v) => { setPartnerName(v); setNameError(false); }}
            onPickAnniversary={setAnniversary}
            onNext={handleNext}
          />
        )}
        {step === 2 && <StepValue partnerName={partnerName.trim() || 'her'} onNext={handleNext} />}
        {step === 3 && (
          <StepNotifications
            onEnable={handleEnableNotifications}
            onSkip={handleFinish}
          />
        )}
      </Animated.View>

      <Dots step={step} />
    </View>
  );
}

// ─── Step 0: Welcome ─────────────────────────────────────────────────────────

function StepWelcome({ onNext }: { onNext: () => void }) {
  const mascotAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(mascotAnim, {
      toValue: 1,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.stepContainer} bounces={false}>
      <Animated.Image
        source={MASCOT_MAIN}
        style={[
          styles.mascotLarge,
          {
            transform: [
              { scale: mascotAnim },
              {
                translateY: mascotAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [40, 0],
                }),
              },
            ],
          },
        ]}
        resizeMode="contain"
      />

      <Text style={styles.brand}>TEXT HER BRO</Text>
      <View style={styles.badgeRow}>
        <View style={styles.goldBadge}>
          <Text style={styles.goldBadgeText}>THE RELATIONSHIP EDGE</Text>
        </View>
      </View>

      <Text style={styles.heroTitle}>Stop winging it.{'\n'}Start winning.</Text>
      <Text style={styles.heroSubtitle}>
        Your personal coach for being the partner she brags about.
      </Text>

      <TouchableOpacity style={styles.primaryBtn} onPress={onNext} activeOpacity={0.85}>
        <Text style={styles.primaryBtnText}>Let's Go 🔥</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Step 1: Partner Setup ────────────────────────────────────────────────────

function StepPartner({
  name, anniversary, nameError,
  onChangeName, onPickAnniversary, onNext,
}: {
  name: string;
  anniversary: Date | null;
  nameError: boolean;
  onChangeName: (v: string) => void;
  onPickAnniversary: (d: Date | null) => void;
  onNext: () => void;
}) {
  const [showPicker, setShowPicker] = useState(false);

  const formattedDate = anniversary
    ? anniversary.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.stepContainer} bounces={false} keyboardShouldPersistTaps="handled">
        <Image source={MASCOT_THINKING} style={styles.mascotMedium} resizeMode="contain" />

        <Text style={styles.stepTitle}>Who are we{'\n'}texting? 👀</Text>
        <Text style={styles.stepSubtitle}>
          We'll personalize everything for you.
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Her name</Text>
          <TextInput
            style={[styles.input, nameError && styles.inputError]}
            placeholder="e.g. Sarah"
            placeholderTextColor="#444"
            value={name}
            onChangeText={onChangeName}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
          />
          {nameError && (
            <Text style={styles.errorText}>Her name is required 😅</Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            Anniversary  <Text style={styles.inputLabelOptional}>(optional)</Text>
          </Text>
          <TouchableOpacity
            style={[styles.input, styles.datePickerBtn]}
            onPress={() => setShowPicker(true)}
            activeOpacity={0.7}
          >
            <Text style={formattedDate ? styles.datePickerValue : styles.datePickerPlaceholder}>
              {formattedDate ?? 'Tap to select a date'}
            </Text>
            {anniversary && (
              <TouchableOpacity
                onPress={() => onPickAnniversary(null)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.dateClearBtn}>✕</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </View>

        {/* Native date picker in a bottom-sheet modal */}
        <Modal
          visible={showPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowPicker(false)}
        >
          <TouchableOpacity
            style={styles.pickerOverlay}
            activeOpacity={1}
            onPress={() => setShowPicker(false)}
          />
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHeader}>
              <TouchableOpacity onPress={() => { onPickAnniversary(null); setShowPicker(false); }}>
                <Text style={styles.pickerCancelText}>Clear</Text>
              </TouchableOpacity>
              <Text style={styles.pickerTitle}>Anniversary</Text>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Text style={styles.pickerDoneText}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={anniversary ?? new Date(2022, 5, 14)}
              mode="date"
              display="spinner"
              textColor="#FFFFFF"
              maximumDate={new Date()}
              onChange={(_event, selected) => {
                if (selected) onPickAnniversary(selected);
              }}
              style={styles.picker}
            />
          </View>
        </Modal>

        <TouchableOpacity style={styles.primaryBtn} onPress={onNext} activeOpacity={0.85}>
          <Text style={styles.primaryBtnText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Step 2: Value Reveal ─────────────────────────────────────────────────────

const VALUE_ITEMS = [
  { emoji: '📊', title: 'Relationship Score', desc: 'Know exactly where you stand — daily.' },
  { emoji: '💬', title: 'What to Say', desc: 'AI-crafted texts for every moment.' },
  { emoji: '🔥', title: 'Streaks & Reminders', desc: 'Build habits that actually stick.' },
];

function StepValue({ partnerName, onNext }: { partnerName: string; onNext: () => void }) {
  return (
    <ScrollView contentContainerStyle={styles.stepContainer} bounces={false}>
      <Image source={MASCOT_CELEBRATE} style={styles.mascotMedium} resizeMode="contain" />

      <Text style={styles.stepTitle}>
        Level up{'\n'}with {partnerName} 🚀
      </Text>
      <Text style={styles.stepSubtitle}>Here's what you're unlocking:</Text>

      <View style={styles.valueList}>
        {VALUE_ITEMS.map((item, i) => (
          <View key={i} style={styles.valueCard}>
            <Text style={styles.valueEmoji}>{item.emoji}</Text>
            <View style={styles.valueText}>
              <Text style={styles.valueTitle}>{item.title}</Text>
              <Text style={styles.valueDesc}>{item.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={onNext} activeOpacity={0.85}>
        <Text style={styles.primaryBtnText}>I'm Ready 💪</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Step 3: Notifications ────────────────────────────────────────────────────

function StepNotifications({
  onEnable, onSkip,
}: {
  onEnable: () => void;
  onSkip: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.stepContainer} bounces={false}>
      <Image source={MASCOT_THUMBSUP} style={styles.mascotMedium} resizeMode="contain" />

      <Text style={styles.stepTitle}>Stay consistent.{'\n'}Get the edge. 👑</Text>
      <Text style={styles.stepSubtitle}>
        Daily reminders keep your score climbing. Most guys forget — you won't.
      </Text>

      <View style={styles.notifList}>
        {[
          { emoji: '⏰', text: 'Daily check-in nudge' },
          { emoji: '🔥', text: 'Streak alerts before they break' },
          { emoji: '💡', text: 'Personalized tips for today' },
        ].map((item, i) => (
          <View key={i} style={styles.notifRow}>
            <Text style={styles.notifEmoji}>{item.emoji}</Text>
            <Text style={styles.notifText}>{item.text}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={onEnable} activeOpacity={0.85}>
        <Text style={styles.primaryBtnText}>Enable Reminders 🔔</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.skipBtn} onPress={onSkip}>
        <Text style={styles.skipBtnText}>Maybe later</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    justifyContent: 'space-between',
  },
  slide: {
    flex: 1,
  },
  stepContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 64,
    paddingBottom: 24,
  },

  // Mascots
  mascotLarge: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  mascotMedium: {
    width: 140,
    height: 140,
    marginBottom: 24,
  },

  // Welcome step
  brand: {
    color: '#F5C518',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 10,
  },
  badgeRow: {
    marginBottom: 20,
  },
  goldBadge: {
    borderWidth: 1,
    borderColor: '#F5C51840',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    backgroundColor: '#F5C51812',
  },
  goldBadgeText: {
    color: '#F5C518',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 42,
    marginBottom: 14,
  },
  heroSubtitle: {
    color: '#777777',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 48,
    paddingHorizontal: 10,
  },

  // Step headers
  stepTitle: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: 10,
  },
  stepSubtitle: {
    color: '#777777',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 8,
  },

  // Inputs
  inputGroup: {
    width: '100%',
    marginBottom: 18,
  },
  inputLabel: {
    color: '#AAAAAA',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  inputLabelOptional: {
    color: '#555555',
    fontWeight: '400',
    textTransform: 'none',
    fontSize: 12,
  },
  input: {
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  inputError: {
    borderColor: '#FF4444',
  },
  errorText: {
    color: '#FF4444',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },

  // Value cards
  valueList: {
    width: '100%',
    gap: 10,
    marginBottom: 40,
  },
  valueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#222222',
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  valueEmoji: {
    fontSize: 28,
  },
  valueText: {
    flex: 1,
  },
  valueTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 3,
  },
  valueDesc: {
    color: '#666666',
    fontSize: 13,
    lineHeight: 18,
  },

  // Notification rows
  notifList: {
    width: '100%',
    gap: 14,
    marginBottom: 40,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#222222',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  notifEmoji: {
    fontSize: 22,
  },
  notifText: {
    color: '#DDDDDD',
    fontSize: 15,
    fontWeight: '600',
  },

  // Date picker
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  datePickerValue: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
  },
  datePickerPlaceholder: {
    color: '#444444',
    fontSize: 17,
    fontWeight: '400',
    flex: 1,
  },
  dateClearBtn: {
    color: '#555555',
    fontSize: 16,
    fontWeight: '600',
    paddingLeft: 8,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  pickerSheet: {
    backgroundColor: '#161616',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  pickerTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  pickerCancelText: {
    color: '#666666',
    fontSize: 15,
    fontWeight: '600',
  },
  pickerDoneText: {
    color: '#F5C518',
    fontSize: 15,
    fontWeight: '700',
  },
  picker: {
    height: 200,
  },

  // Buttons
  primaryBtn: {
    width: '100%',
    backgroundColor: '#F5C518',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 14,
  },
  primaryBtnText: {
    color: '#0A0A0A',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  skipBtn: {
    paddingVertical: 10,
  },
  skipBtnText: {
    color: '#555555',
    fontSize: 14,
    fontWeight: '600',
  },

  // Dots
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 40,
    paddingTop: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2A2A2A',
  },
  dotDone: {
    backgroundColor: '#F5C51860',
  },
  dotActive: {
    width: 22,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F5C518',
  },
});
