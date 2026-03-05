import React, { useEffect, useRef, useMemo } from 'react';
import { Animated, Text, StyleSheet, Image } from 'react-native';

const MASCOT_LAUGHING = require('../../assets/mascot/laughingmascot.png');

interface CopiedToastProps {
  visible: boolean;
}

const TOAST_MESSAGES = [
  'Copied. Go get her, king. 👑',
  'Copied. Now send it. 📲',
  'In your clipboard. Don\'t chicken out.',
  'Copied. She\'s gonna love it. ✅',
  'Got it. Now hit send, bro.',
  'Locked and loaded. 🔥',
];

export default function CopiedToast({ visible }: CopiedToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const message = useMemo(
    () => TOAST_MESSAGES[Math.floor(Math.random() * TOAST_MESSAGES.length)],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visible],
  );

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(1400),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, opacity]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Image source={MASCOT_LAUGHING} style={styles.toastMascot} resizeMode="contain" />
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    backgroundColor: '#F5C518',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toastMascot: {
    width: 22,
    height: 22,
  },
  text: {
    color: '#0A0A0A',
    fontSize: 14,
    fontWeight: '800',
  },
});
