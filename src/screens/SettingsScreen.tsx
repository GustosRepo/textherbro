import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
} from 'react-native';

const MASCOT_REFLECTING = require('../../assets/mascot/relfectingmascot.png');
import { useFocusEffect } from '@react-navigation/native';
import { getSettings, saveSettings, getPartner } from '../services/storage';
import {
  registerForPushNotifications,
  scheduleReminders,
  cancelAllReminders,
} from '../services/reminders';
import { isPremium } from '../services/premium';
import { PaywallReason } from '../services/paywall';
import PaywallModal from '../components/PaywallModal';

const REMINDER_TIMES = [
  { label: '7:00 AM', hour: 7, minute: 0 },
  { label: '9:00 AM', hour: 9, minute: 0 },
  { label: '12:00 PM', hour: 12, minute: 0 },
  { label: '3:00 PM', hour: 15, minute: 0 },
  { label: '6:00 PM', hour: 18, minute: 0 },
  { label: '9:00 PM', hour: 21, minute: 0 },
];

export default function SettingsScreen({ navigation }: any) {
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [partnerName, setPartnerName] = useState<string | null>(null);
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [paywallReason, setPaywallReason] = useState<PaywallReason>('general');
  const [reminderHour, setReminderHour] = useState(18);
  const [reminderMinute, setReminderMinute] = useState(0);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const [settings, partner, premium] = await Promise.all([
          getSettings(),
          getPartner(),
          isPremium(),
        ]);
        setRemindersEnabled(settings.remindersEnabled);
        setReminderHour(settings.reminderHour ?? 18);
        setReminderMinute(settings.reminderMinute ?? 0);
        setPartnerName(partner?.name ?? null);
        setIsPremiumUser(premium);
      })();
    }, []),
  );

  const toggleReminders = async (value: boolean) => {
    setRemindersEnabled(value);
    await saveSettings({ remindersEnabled: value, reminderHour, reminderMinute });

    if (value) {
      const status = await registerForPushNotifications();
      if (status === 'granted') {
        await scheduleReminders({ hour: reminderHour, minute: reminderMinute });
        Alert.alert('Reminders On 🔔', "We got your back, king.");
      } else {
        Alert.alert('Permissions Needed', 'Enable notifications in Settings to get reminders.');
        setRemindersEnabled(false);
        await saveSettings({ remindersEnabled: false, reminderHour, reminderMinute });
      }
    } else {
      await cancelAllReminders();
      Alert.alert('Reminders Off', "Alright, you're on your own bro.");
    }
  };

  const handleTimeSelect = async (hour: number, minute: number) => {
    setReminderHour(hour);
    setReminderMinute(minute);
    await saveSettings({ remindersEnabled, reminderHour: hour, reminderMinute: minute });
    if (remindersEnabled) {
      await scheduleReminders({ hour, minute });
    }
  };

  const currentTimeLabel =
    REMINDER_TIMES.find(t => t.hour === reminderHour && t.minute === reminderMinute)?.label ??
    `${reminderHour}:${String(reminderMinute).padStart(2, '0')}`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings ⚙️</Text>

      {/* Reminders toggle */}
      <View style={styles.settingRow}>
        <View>
          <Text style={styles.settingLabel}>Reminders</Text>
          <Text style={styles.settingDescription}>
            Daily nudges to keep you in check
          </Text>
        </View>
        <Switch
          value={remindersEnabled}
          onValueChange={toggleReminders}
          trackColor={{ false: '#2A2A2A', true: '#F5C51850' }}
          thumbColor={remindersEnabled ? '#F5C518' : '#666666'}
        />
      </View>

      {/* PRO: Reminder time picker */}
      {isPremiumUser && remindersEnabled && (
        <View style={styles.timePickerCard}>
          <Text style={styles.timePickerLabel}>⏰ Reminder Time</Text>
          <Text style={styles.timePickerSub}>
            Smart fumble alerts trigger automatically. This sets your daily check-in time.
          </Text>
          <View style={styles.timeChips}>
            {REMINDER_TIMES.map((t) => {
              const isSelected = t.hour === reminderHour && t.minute === reminderMinute;
              return (
                <TouchableOpacity
                  key={t.label}
                  style={[styles.timeChip, isSelected && styles.timeChipSelected]}
                  onPress={() => handleTimeSelect(t.hour, t.minute)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.timeChipText, isSelected && styles.timeChipTextSelected]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Edit partner */}
      <TouchableOpacity
        style={styles.settingRow}
        onPress={() => navigation.navigate('Partner')}
      >
        <View>
          <Text style={styles.settingLabel}>
            {partnerName ? `Edit ${partnerName}'s Info` : 'Add Partner'}
          </Text>
          <Text style={styles.settingDescription}>
            Name, birthday, anniversary
          </Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      {/* Premium */}
      {isPremiumUser ? (
        <View style={[styles.settingRow, styles.premiumRow]}>
          <View>
            <Text style={styles.premiumLabel}>Premium Active 👑</Text>
            <Text style={styles.settingDescription}>
              All features unlocked
            </Text>
          </View>
          <Text style={styles.premiumBadge}>PRO</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.settingRow, styles.upgradeRow]}
          onPress={() => {
            setPaywallReason('general');
            setPaywallVisible(true);
          }}
        >
          <View>
            <Text style={styles.upgradeLabel}>Upgrade to Premium</Text>
            <Text style={styles.settingDescription}>
              Unlimited suggestions, notes, badges & more
            </Text>
          </View>
          <Text style={styles.chevron}>👑</Text>
        </TouchableOpacity>
      )}

      {/* App info */}
      <View style={styles.footer}>
        <Image source={MASCOT_REFLECTING} style={styles.footerMascot} resizeMode="contain" />
        <Text style={styles.appName}>Text Her Bro</Text>
        <Text style={styles.version}>v1.0.0 • MVP</Text>
        <Text style={styles.tagline}>
          Don't be that guy. 💀
        </Text>
      </View>

      <PaywallModal
        visible={paywallVisible}
        reason={paywallReason}
        onClose={() => setPaywallVisible(false)}
        onPurchased={async () => {
          setIsPremiumUser(true);
          setPaywallVisible(false);
        }}
      />
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
    paddingBottom: 40,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 30,
  },
  settingRow: {
    backgroundColor: '#161616',
    borderRadius: 14,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  settingLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  settingDescription: {
    color: '#666666',
    fontSize: 13,
    marginTop: 4,
  },
  chevron: {
    color: '#666666',
    fontSize: 24,
  },
  // Time picker
  timePickerCard: {
    backgroundColor: '#161616',
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F5C51830',
  },
  timePickerLabel: {
    color: '#F5C518',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  timePickerSub: {
    color: '#666666',
    fontSize: 12,
    marginBottom: 14,
    lineHeight: 17,
  },
  timeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  timeChipSelected: {
    backgroundColor: '#F5C51815',
    borderColor: '#F5C518',
  },
  timeChipText: {
    color: '#999999',
    fontSize: 13,
    fontWeight: '600',
  },
  timeChipTextSelected: {
    color: '#F5C518',
  },
  // Premium rows
  premiumRow: {
    borderColor: '#F5C51830',
    borderWidth: 1,
  },
  premiumLabel: {
    color: '#F5C518',
    fontSize: 16,
    fontWeight: '700',
  },
  premiumBadge: {
    color: '#0A0A0A',
    backgroundColor: '#F5C518',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
  upgradeRow: {
    borderColor: '#F5C51840',
    borderWidth: 1,
  },
  upgradeLabel: {
    color: '#F5C518',
    fontSize: 16,
    fontWeight: '700',
  },
  footerMascot: {
    width: 64,
    height: 64,
    marginBottom: 12,
  },
  footer: {
    alignItems: 'center',
    marginTop: 60,
  },
  appName: {
    color: '#F5C518',
    fontSize: 18,
    fontWeight: '800',
  },
  version: {
    color: '#444444',
    fontSize: 13,
    marginTop: 4,
  },
  tagline: {
    color: '#666666',
    fontSize: 13,
    marginTop: 12,
  },
});

