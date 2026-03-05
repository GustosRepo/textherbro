import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image, TouchableOpacity } from 'react-native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

const MASCOT_CELEBRATING = require('../../assets/mascot/celebratingmascot.png');
const MASCOT_CRASHING = require('../../assets/mascot/crashingoutmascot.png');
const MASCOT_THINKING = require('../../assets/mascot/thinkingmascot.png');

interface ScoreCardProps {
  score: number;
}

export default function ScoreCard({ score }: ScoreCardProps) {
  const glowAnim = useRef(new Animated.Value(0)).current;
  const viewShotRef = useRef<ViewShot>(null);

  const getScoreColor = () => {
    if (score >= 90) return '#F5C518';
    if (score >= 75) return '#D4A816';
    if (score >= 60) return '#C9961A';
    if (score >= 45) return '#FF8C00';
    return '#FF4444';
  };

  const getScoreLabel = () => {
    if (score >= 90) return 'King shit 👑';
    if (score >= 75) return 'Solid. Keep it up.';
    if (score >= 60) return 'Mid. She notices.';
    if (score >= 45) return "She's getting annoyed bro";
    return "You're cooked 💀";
  };

  const getBorderGlow = () => {
    if (score >= 75) return '#F5C51840';
    if (score >= 45) return '#FF8C0030';
    return '#FF444440';
  };

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: false,
        }),
      ]),
    ).start();
  }, [glowAnim]);

  const borderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [getBorderGlow(), getScoreColor()],
  });

  const getScoreMascot = () => {
    if (score >= 75) return MASCOT_CELEBRATING;
    if (score >= 45) return MASCOT_THINKING;
    return MASCOT_CRASHING;
  };

  const handleShare = async () => {
    try {
      if (!viewShotRef.current?.capture) return;
      const uri = await viewShotRef.current.capture();
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share your Boyfriend Score',
        });
      }
    } catch {
      // Sharing failed silently
    }
  };

  const barWidth = Math.max(5, Math.min(score, 100));
  const color = getScoreColor();

  return (
    <View>
      <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
        <Animated.View style={[styles.card, { borderColor }]}>
          <Image source={getScoreMascot()} style={styles.mascot} resizeMode="contain" />
          <Text style={styles.label}>Boyfriend Score</Text>
          <Text style={[styles.score, { color }]}>{score}</Text>
          <Text style={styles.sublabel}>{getScoreLabel()}</Text>

          {/* Progress bar */}
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${barWidth}%`, backgroundColor: color }]} />
          </View>

          <Text style={styles.watermark}>Text Her Bro</Text>
        </Animated.View>
      </ViewShot>

      <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.7}>
        <Text style={styles.shareBtnText}>📤 Share Score</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#161616',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  mascot: {
    width: 64,
    height: 64,
    marginBottom: 8,
  },
  label: {
    color: '#999999',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 4,
  },
  score: {
    fontSize: 80,
    fontWeight: '900',
    letterSpacing: -2,
  },
  sublabel: {
    color: '#999999',
    fontSize: 14,
    marginTop: 4,
    fontWeight: '600',
  },
  barTrack: {
    width: '100%',
    height: 4,
    backgroundColor: '#2A2A2A',
    borderRadius: 2,
    marginTop: 16,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
  },
  watermark: {
    color: '#F5C51860',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 12,
    textTransform: 'uppercase',
  },
  shareBtn: {
    alignSelf: 'center',
    backgroundColor: '#F5C51815',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F5C51830',
  },
  shareBtnText: {
    color: '#F5C518',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
