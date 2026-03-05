import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface SuggestionRowProps {
  label: string;
  emoji: string;
  text: string;
  onCopy: () => void;
  onNext: () => void;
  onDone: () => void;
}

export default function SuggestionRow({
  label,
  emoji,
  text,
  onCopy,
  onNext,
  onDone,
}: SuggestionRowProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={styles.text}>{text}</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.btn} onPress={onCopy}>
          <Text style={styles.btnText}>Copy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={onNext}>
          <Text style={styles.btnText}>Another</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.doneBtnBg]} onPress={onDone}>
          <Text style={[styles.btnText, styles.doneBtnText]}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  emoji: {
    fontSize: 16,
    marginRight: 6,
  },
  label: {
    color: '#999999',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 10,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  btnText: {
    color: '#999999',
    fontSize: 12,
    fontWeight: '700',
  },
  doneBtnBg: {
    backgroundColor: '#F5C51815',
    borderColor: '#F5C51850',
  },
  doneBtnText: {
    color: '#F5C518',
  },
});
