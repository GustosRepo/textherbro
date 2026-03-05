import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { FumbleAlert } from '../services/storage';

const MASCOT_SMALL = require('../../assets/mascot/smallmain.png');

interface FumbleAlertsCardProps {
  alerts: FumbleAlert[];
}

export default function FumbleAlertsCard({ alerts }: FumbleAlertsCardProps) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (alerts.length > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: false,
          }),
          Animated.timing(pulse, {
            toValue: 0,
            duration: 1200,
            useNativeDriver: false,
          }),
        ]),
      ).start();
    }
  }, [alerts.length, pulse]);

  if (alerts.length === 0) return null;

  const borderColor = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: ['#FF444430', '#FF4444'],
  });

  return (
    <Animated.View style={[styles.card, { borderColor }]}>
      <View style={styles.headerRow}>
        <Image source={MASCOT_SMALL} style={styles.headerMascot} resizeMode="contain" />
        <Text style={styles.header}>FUMBLE ALERT</Text>
      </View>
      {alerts.map((alert, i) => (
        <View key={i} style={styles.row}>
          <Text style={styles.emoji}>{alert.emoji}</Text>
          <Text style={styles.text}>{alert.message}</Text>
        </View>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#161616',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1.5,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  headerMascot: {
    width: 20,
    height: 20,
  },
  header: {
    color: '#FF4444',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  emoji: {
    fontSize: 16,
    marginRight: 10,
  },
  text: {
    color: '#FF4444',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
});
