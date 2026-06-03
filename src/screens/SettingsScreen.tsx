import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  ScrollView,
  Linking,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const PRIVACY_URL = 'https://code-werx.com/textherbro-privacy';
const TERMS_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
const SUPPORT_EMAIL = 'mailto:support@textherbro.com';

const openSupport = () => {
  Linking.openURL(SUPPORT_EMAIL).catch(() =>
    Linking.openURL('https://code-werx.com/textherbro-privacy')
  );
};

const MASCOT_REFLECTING = require('../../assets/mascot/relfectingmascot.png');
import { useFocusEffect } from '@react-navigation/native';
import { getSettings, saveSettings, getPartner } from '../services/storage';
import {
  registerForPushNotifications,
  scheduleReminders,
  cancelAllReminders,
} from '../services/reminders';
import { PaywallReason, checkSubscriptionStatus } from '../services/paywall';
import PaywallModal from '../components/PaywallModal';

function formatReminderTime(hour: number, minute: number): string {
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h = hour % 12 || 12;
  return `${h}:${String(minute).padStart(2, '0')} ${ampm}`;
}

export default function SettingsScreen({ navigation }: any) {
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [partnerName, setPartnerName] = useState<string | null>(null);
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [paywallReason, setPaywallReason] = useState<PaywallReason>('general');
  const [reminderHour, setReminderHour] = useState(18);
  const [reminderMinute, setReminderMinute] = useState(0);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const [settings, partner, premium] = await Promise.all([
          getSettings(),
          getPartner(),
          checkSubscriptionStatus(),
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

  const currentTimeLabel = formatReminderTime(reminderHour, reminderMinute);

  // Build a Date object whose hours/minutes match the stored reminder time
  const reminderTimeAsDate = (() => {
    const d = new Date();
    d.setHours(reminderHour, reminderMinute, 0, 0);
    return d;
  })();

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
        <>
          <TouchableOpacity
            style={styles.timePickerCard}
            onPress={() => setShowTimePicker(true)}
            activeOpacity={0.7}
          >
            <View style={styles.timePickerRow}>
              <View>
                <Text style={styles.timePickerLabel}>⏰ Reminder Time</Text>
                <Text style={styles.timePickerSub}>
                  Daily check-in nudge. Fumble alerts trigger automatically.
                </Text>
              </View>
              <View style={styles.timePickerBadge}>
                <Text style={styles.timePickerBadgeText}>{currentTimeLabel}</Text>
              </View>
            </View>
          </TouchableOpacity>

          <Modal
            visible={showTimePicker}
            transparent
            animationType="slide"
            onRequestClose={() => setShowTimePicker(false)}
          >
            <TouchableOpacity
              style={styles.pickerOverlay}
              activeOpacity={1}
              onPress={() => setShowTimePicker(false)}
            />
            <View style={styles.pickerSheet}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                  <Text style={styles.pickerCancelText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.pickerTitle}>Reminder Time</Text>
                <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                  <Text style={styles.pickerDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={reminderTimeAsDate}
                mode="time"
                display="spinner"
                textColor="#FFFFFF"
                onChange={(_event, selected) => {
                  if (selected) {
                    handleTimeSelect(selected.getHours(), selected.getMinutes());
                  }
                }}
                style={styles.picker}
              />
            </View>
          </Modal>
        </>
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
        <>
          <View style={[styles.settingRow, styles.premiumRow]}>
            <View>
              <Text style={styles.premiumLabel}>Premium Active 👑</Text>
              <Text style={styles.settingDescription}>
                All features unlocked
              </Text>
            </View>
            <Text style={styles.premiumBadge}>PRO</Text>
          </View>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => Linking.openURL('https://apps.apple.com/account/subscriptions')}
          >
            <View>
              <Text style={styles.settingLabel}>Manage Subscription</Text>
              <Text style={styles.settingDescription}>
                Change plan, cancel, or view billing
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </>
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

      {/* Legal & Support */}
      <TouchableOpacity
        style={styles.settingRow}
        onPress={() => Linking.openURL(PRIVACY_URL)}
      >
        <Text style={styles.settingLabel}>Privacy Policy</Text>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.settingRow}
        onPress={() => Linking.openURL(TERMS_URL)}
      >
        <Text style={styles.settingLabel}>Terms of Use (EULA)</Text>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.settingRow}
        onPress={openSupport}
      >
        <Text style={styles.settingLabel}>Contact Support</Text>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      {/* App info */}
      <View style={styles.footer}>
        <Image source={MASCOT_REFLECTING} style={styles.footerMascot} resizeMode="contain" />
        <Text style={styles.appName}>Text Her Bro</Text>
        <Text style={styles.version}>v1.0.0</Text>
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
  timePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    lineHeight: 17,
    maxWidth: '80%',
  },
  timePickerBadge: {
    backgroundColor: '#F5C51815',
    borderWidth: 1,
    borderColor: '#F5C518',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  timePickerBadgeText: {
    color: '#F5C518',
    fontSize: 14,
    fontWeight: '700',
  },
  // Time picker modal sheet
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  pickerSheet: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  pickerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  pickerCancelText: {
    color: '#666666',
    fontSize: 15,
  },
  pickerDoneText: {
    color: '#F5C518',
    fontSize: 15,
    fontWeight: '700',
  },
  picker: {
    height: 200,
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

