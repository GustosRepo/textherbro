import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  Image,
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

export default function SettingsScreen({ navigation }: any) {
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [partnerName, setPartnerName] = useState<string | null>(null);
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [paywallReason, setPaywallReason] = useState<PaywallReason>('general');

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const [settings, partner, premium] = await Promise.all([
          getSettings(),
          getPartner(),
          isPremium(),
        ]);
        setRemindersEnabled(settings.remindersEnabled);
        setPartnerName(partner?.name ?? null);
        setIsPremiumUser(premium);
      })();
    }, []),
  );

  const toggleReminders = async (value: boolean) => {
    setRemindersEnabled(value);
    await saveSettings({ remindersEnabled: value });

    if (value) {
      const status = await registerForPushNotifications();
      if (status === 'granted') {
        await scheduleReminders();
        Alert.alert('Reminders On 🔔', "We got your back, king.");
      } else {
        Alert.alert(
          'Permissions Needed',
          'Enable notifications in Settings to get reminders.',
        );
        setRemindersEnabled(false);
        await saveSettings({ remindersEnabled: false });
      }
    } else {
      await cancelAllReminders();
      Alert.alert('Reminders Off', "Alright, you're on your own bro.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
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
