import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from './src/screens/HomeScreen';
import AddPartnerScreen from './src/screens/AddPartnerScreen';
import NotesScreen from './src/screens/NotesScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';

import { registerForPushNotifications, scheduleReminders } from './src/services/reminders';
import { getSettings } from './src/services/storage';
import { initializeRevenueCat } from './src/services/paywall';
import { trackEvent } from './src/services/analytics';

const Tab = createBottomTabNavigator();

export default function App() {
  useEffect(() => {
    (async () => {
      await initializeRevenueCat();
      await trackEvent('app_open');

      const settings = await getSettings();
      if (settings.remindersEnabled) {
        const status = await registerForPushNotifications();
        if (status === 'granted') {
          await scheduleReminders();
        }
      }
    })();
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <NavigationContainer>
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
      </NavigationContainer>
    </>
  );
}
