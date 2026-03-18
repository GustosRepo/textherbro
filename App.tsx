import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingScreen from './src/screens/OnboardingScreen';

import HomeScreen from './src/screens/HomeScreen';
import AddPartnerScreen from './src/screens/AddPartnerScreen';
import NotesScreen from './src/screens/NotesScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';
import SOSScreen from './src/screens/SOSScreen';
import PlaybookScreen from './src/screens/PlaybookScreen';
import MilestonesScreen from './src/screens/MilestonesScreen';

import { registerForPushNotifications, scheduleReminders } from './src/services/reminders';
import { getSettings } from './src/services/storage';
import { initializeRevenueCat } from './src/services/paywall';
import { trackEvent } from './src/services/analytics';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0A0A0A',
          borderTopColor: '#1A1A1A',
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 88,
        },
        tabBarActiveTintColor: '#F5C518',
        tabBarInactiveTintColor: '#666666',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'Partner') iconName = 'heart';
          else if (route.name === 'Notes') iconName = 'bulb';
          else if (route.name === 'Stats') iconName = 'stats-chart';
          else if (route.name === 'Settings') iconName = 'settings';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen
        name="Partner"
        component={AddPartnerScreen}
        options={{ tabBarLabel: 'Partner' }}
      />
      <Tab.Screen
        name="Notes"
        component={NotesScreen}
        options={{ tabBarLabel: 'Memory' }}
      />
      <Tab.Screen
        name="Stats"
        component={AnalyticsScreen}
        options={{ tabBarLabel: 'Stats' }}
      />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

const ONBOARDING_KEY = '@textherbro_onboarding_done';

export default function App() {
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      await initializeRevenueCat();
      await trackEvent('app_open');

      const done = await AsyncStorage.getItem(ONBOARDING_KEY);
      setOnboardingDone(done === 'true');

      const settings = await getSettings();
      if (settings.remindersEnabled) {
        const status = await registerForPushNotifications();
        if (status === 'granted') {
          await scheduleReminders();
        }
      }
    })();
  }, []);

  const handleOnboardingComplete = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setOnboardingDone(true);
  };

  // Still loading — render nothing (splash screen stays visible)
  if (onboardingDone === null) {
    return <View style={{ flex: 1, backgroundColor: '#0A0A0A' }} />;
  }

  if (!onboardingDone) {
    return (
      <>
        <ExpoStatusBar style="light" />
        <OnboardingScreen onComplete={handleOnboardingComplete} />
      </>
    );
  }

  return (
    <>
      <ExpoStatusBar style="light" />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Tabs" component={TabNavigator} />
          <Stack.Screen
            name="SOS"
            component={SOSScreen}
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen
            name="Playbook"
            component={PlaybookScreen}
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen
            name="Milestones"
            component={MilestonesScreen}
            options={{ presentation: 'modal' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

