import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface CountdownItem {
  label: string;
  emoji: string;
  daysLeft: number;
}

interface CountdownCardProps {
  items: CountdownItem[];
}

export default function CountdownCard({ items }: CountdownCardProps) {
  if (items.length === 0) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Coming Up</Text>
      {items.map((item, i) => (
        <View key={i} style={styles.row}>
          <Text style={styles.emoji}>{item.emoji}</Text>
          <Text style={styles.label}>{item.label}</Text>
          <View style={styles.badge}>
            <Text style={styles.days}>
              {item.daysLeft === 0 ? 'TODAY' : `${item.daysLeft}d`}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#161616',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  title: {
    color: '#F5C518',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  emoji: {
    fontSize: 20,
    marginRight: 12,
  },
  label: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#F5C51820',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  days: {
    color: '#F5C518',
    fontSize: 14,
    fontWeight: '800',
  },
});
