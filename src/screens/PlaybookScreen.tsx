/**
 * Playbook Screen — Saved Lines vault.
 * PRO only.
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';
import { getSavedLines, deleteSavedLine, incrementLineUsage } from '../services/storage';
import { SavedLine } from '../types/partner';
import { trackEvent } from '../services/analytics';

const CATEGORY_META: Record<SavedLine['category'], { label: string; emoji: string; color: string }> = {
  compliment: { label: 'Compliment', emoji: '😍', color: '#F5C518' },
  checkIn:    { label: 'Check-in',   emoji: '💬', color: '#4CAF50' },
  dateIdea:   { label: 'Date Idea',  emoji: '🌹', color: '#E91E8C' },
  deep:       { label: 'Deep Talk',  emoji: '🧠', color: '#9C27B0' },
  sos:        { label: 'SOS Line',   emoji: '🆘', color: '#FF4444' },
};

const FILTER_OPTIONS: (SavedLine['category'] | 'all')[] = ['all', 'compliment', 'checkIn', 'dateIdea', 'deep', 'sos'];

function LineCard({ line, onDelete }: { line: SavedLine; onDelete: (id: string) => void }) {
  const meta = CATEGORY_META[line.category];

  const handleCopy = async () => {
    await Clipboard.setStringAsync(line.text);
    await incrementLineUsage(line.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    trackEvent('saved_line_used', { category: line.category });
  };

  const handleDelete = () => {
    Alert.alert('Remove line?', 'Gone from your playbook forever.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => onDelete(line.id) },
    ]);
  };

  return (
    <View style={styles.lineCard}>
      <View style={styles.lineHeader}>
        <View style={[styles.catBadge, { backgroundColor: meta.color + '20', borderColor: meta.color + '60' }]}>
          <Text style={styles.catEmoji}>{meta.emoji}</Text>
          <Text style={[styles.catLabel, { color: meta.color }]}>{meta.label}</Text>
        </View>
        {line.timesUsed > 0 && (
          <Text style={styles.usedCount}>Used {line.timesUsed}×</Text>
        )}
      </View>
      <Text style={styles.lineText}>{line.text}</Text>
      <View style={styles.lineActions}>
        <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
          <Text style={styles.copyBtnText}>📋 Copy & Use</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function PlaybookScreen() {
  const [lines, setLines] = useState<SavedLine[]>([]);
  const [filter, setFilter] = useState<SavedLine['category'] | 'all'>('all');

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const stored = await getSavedLines();
        setLines(stored);
      })();
    }, []),
  );

  const handleDelete = async (id: string) => {
    const updated = await deleteSavedLine(id);
    setLines(updated);
  };

  const filtered = filter === 'all' ? lines : lines.filter((l) => l.category === filter);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📓 My Playbook</Text>
        <Text style={styles.subtitle}>Your best lines. The ones that work.</Text>
      </View>

      {/* Filter chips */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={FILTER_OPTIONS}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.filterRow}
        renderItem={({ item }) => {
          const isAll = item === 'all';
          const meta = isAll ? null : CATEGORY_META[item as SavedLine['category']];
          const isSelected = filter === item;
          return (
            <TouchableOpacity
              style={[styles.filterChip, isSelected && styles.filterChipSelected]}
              onPress={() => setFilter(item as typeof filter)}
            >
              <Text style={[styles.filterChipText, isSelected && styles.filterChipTextSelected]}>
                {isAll ? '🗂️ All' : `${meta!.emoji} ${meta!.label}`}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* Lines list */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📓</Text>
            <Text style={styles.emptyTitle}>No saved lines yet</Text>
            <Text style={styles.emptySubtitle}>
              Hit the bookmark icon on any suggestion to save it here.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <LineCard line={item} onDelete={handleDelete} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { padding: 20, paddingTop: 60, paddingBottom: 8 },
  title: { color: '#FFFFFF', fontSize: 28, fontWeight: '900', marginBottom: 4 },
  subtitle: { color: '#666666', fontSize: 14 },
  filterRow: { paddingHorizontal: 20, paddingVertical: 12, gap: 8 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, backgroundColor: '#161616',
    borderWidth: 1, borderColor: '#2A2A2A',
  },
  filterChipSelected: { borderColor: '#F5C518', backgroundColor: '#F5C51815' },
  filterChipText: { color: '#999999', fontSize: 13, fontWeight: '600' },
  filterChipTextSelected: { color: '#F5C518' },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  lineCard: {
    backgroundColor: '#161616',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  lineHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  catBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  catEmoji: { fontSize: 12 },
  catLabel: { fontSize: 11, fontWeight: '700' },
  usedCount: { color: '#555555', fontSize: 11, fontWeight: '600' },
  lineText: { color: '#FFFFFF', fontSize: 15, lineHeight: 22, marginBottom: 12 },
  lineActions: { flexDirection: 'row', gap: 8 },
  copyBtn: {
    flex: 1, backgroundColor: '#F5C518', borderRadius: 10,
    paddingVertical: 10, alignItems: 'center',
  },
  copyBtnText: { color: '#0A0A0A', fontSize: 13, fontWeight: '900' },
  deleteBtn: {
    backgroundColor: '#1E1E1E', borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 1, borderColor: '#2A2A2A',
  },
  deleteBtnText: { color: '#666666', fontSize: 13, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', marginBottom: 8 },
  emptySubtitle: { color: '#666666', fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
