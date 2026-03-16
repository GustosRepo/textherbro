/**
 * Milestones Screen — Track relationship milestones.
 * PRO only.
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';
import { getMilestones, addMilestone, deleteMilestone } from '../services/storage';
import { Milestone, MilestoneType, MILESTONE_LABELS } from '../types/partner';
import { trackEvent } from '../services/analytics';

function daysUntilNextAnnual(isoDate: string): number {
  const d = new Date(isoDate);
  const today = new Date();
  const next = new Date(today.getFullYear(), d.getMonth(), d.getDate());
  if (next < today) next.setFullYear(today.getFullYear() + 1);
  return Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function yearsAgo(isoDate: string): number {
  const d = new Date(isoDate);
  const today = new Date();
  return today.getFullYear() - d.getFullYear();
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}

const PRESET_TYPES: MilestoneType[] = ['first_date', 'official', 'first_iloveyou', 'first_trip', 'moved_in', 'engaged', 'custom'];

export default function MilestonesScreen() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedType, setSelectedType] = useState<MilestoneType>('first_date');
  const [customLabel, setCustomLabel] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [noteInput, setNoteInput] = useState('');

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const stored = await getMilestones();
        setMilestones(stored);
      })();
    }, []),
  );

  const handleAdd = async () => {
    const label = selectedType === 'custom'
      ? customLabel.trim()
      : MILESTONE_LABELS[selectedType].label;
    if (!label) { Alert.alert('Add a label for your milestone'); return; }
    if (!dateInput.trim()) { Alert.alert('Add a date'); return; }

    // Basic date parsing: MM/DD/YYYY or YYYY-MM-DD
    let parsed = new Date(dateInput.trim());
    if (isNaN(parsed.getTime())) {
      // Try MM/DD/YYYY
      const parts = dateInput.split('/');
      if (parts.length === 3) {
        parsed = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
      }
    }
    if (isNaN(parsed.getTime())) {
      Alert.alert('Invalid date', 'Use MM/DD/YYYY format.');
      return;
    }

    const updated = await addMilestone({
      type: selectedType,
      label,
      date: parsed.toISOString(),
      note: noteInput.trim() || undefined,
    });
    setMilestones(updated);
    setShowForm(false);
    setCustomLabel('');
    setDateInput('');
    setNoteInput('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    trackEvent('milestone_added', { type: selectedType });
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete milestone?', "This moment lives in your memory, not just the app.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updated = await deleteMilestone(id);
          setMilestones(updated);
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>🏅 Milestones</Text>
        <Text style={styles.subtitle}>Every big moment. Tracked. Celebrated.</Text>

        {/* Add button */}
        {!showForm && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowForm(true)}
          >
            <Text style={styles.addBtnText}>+ Add Milestone</Text>
          </TouchableOpacity>
        )}

        {/* Add form */}
        {showForm && (
          <View style={styles.form}>
            <Text style={styles.formLabel}>MILESTONE TYPE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeRow}>
              {PRESET_TYPES.map((type) => {
                const meta = MILESTONE_LABELS[type];
                const isSelected = selectedType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    style={[styles.typeChip, isSelected && styles.typeChipSelected]}
                    onPress={() => setSelectedType(type)}
                  >
                    <Text style={styles.typeChipEmoji}>{meta.emoji}</Text>
                    <Text style={[styles.typeChipText, isSelected && styles.typeChipTextSelected]}>
                      {meta.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {selectedType === 'custom' && (
              <TextInput
                style={styles.input}
                placeholder="Custom milestone label..."
                placeholderTextColor="#444"
                value={customLabel}
                onChangeText={setCustomLabel}
              />
            )}

            <TextInput
              style={styles.input}
              placeholder="Date (MM/DD/YYYY)"
              placeholderTextColor="#444"
              value={dateInput}
              onChangeText={setDateInput}
              keyboardType="numbers-and-punctuation"
            />
            <TextInput
              style={[styles.input, styles.inputNote]}
              placeholder="Add a note (optional)..."
              placeholderTextColor="#444"
              value={noteInput}
              onChangeText={setNoteInput}
              multiline
            />

            <View style={styles.formActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowForm(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
                <Text style={styles.saveBtnText}>Save Milestone</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Milestones list */}
        {milestones.length === 0 && !showForm ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🏅</Text>
            <Text style={styles.emptyTitle}>No milestones yet</Text>
            <Text style={styles.emptySubtitle}>
              Log your first date, when you made it official, your first trip — every moment matters.
            </Text>
          </View>
        ) : (
          milestones.map((m) => {
            const meta = MILESTONE_LABELS[m.type];
            const years = yearsAgo(m.date);
            const daysLeft = daysUntilNextAnnual(m.date);
            const isToday = daysLeft === 0 || daysLeft === 365;
            return (
              <View key={m.id} style={[styles.milestoneCard, isToday && styles.milestoneCardToday]}>
                <View style={styles.milestoneHeader}>
                  <Text style={styles.milestoneEmoji}>{meta.emoji}</Text>
                  <View style={styles.milestoneInfo}>
                    <Text style={styles.milestoneLabel}>{m.label}</Text>
                    <Text style={styles.milestoneDate}>{formatDate(m.date)}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDelete(m.id)}>
                    <Text style={styles.milestoneDelete}>✕</Text>
                  </TouchableOpacity>
                </View>
                {m.note && <Text style={styles.milestoneNote}>"{m.note}"</Text>}
                <View style={styles.milestoneMeta}>
                  {years > 0 && (
                    <Text style={styles.milestoneMetaText}>{years} year{years !== 1 ? 's' : ''} ago</Text>
                  )}
                  {isToday ? (
                    <Text style={styles.milestoneToday}>🎉 Today!</Text>
                  ) : (
                    <Text style={styles.milestoneDaysLeft}>
                      Anniversary in {daysLeft} day{daysLeft !== 1 ? 's' : ''}
                    </Text>
                  )}
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  content: { padding: 20, paddingTop: 60 },
  title: { color: '#FFFFFF', fontSize: 28, fontWeight: '900', marginBottom: 6 },
  subtitle: { color: '#666666', fontSize: 14, marginBottom: 24 },
  addBtn: {
    backgroundColor: '#F5C518',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  addBtnText: { color: '#0A0A0A', fontSize: 16, fontWeight: '900' },

  form: { backgroundColor: '#161616', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#2A2A2A' },
  formLabel: { color: '#999999', fontSize: 11, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 },
  typeRow: { gap: 8, paddingBottom: 14 },
  typeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#2A2A2A',
  },
  typeChipSelected: { borderColor: '#F5C518', backgroundColor: '#F5C51815' },
  typeChipEmoji: { fontSize: 14 },
  typeChipText: { color: '#999999', fontSize: 12, fontWeight: '600' },
  typeChipTextSelected: { color: '#F5C518' },
  input: {
    backgroundColor: '#0A0A0A', borderRadius: 10, padding: 14,
    color: '#FFFFFF', fontSize: 15, marginBottom: 10,
    borderWidth: 1, borderColor: '#2A2A2A',
  },
  inputNote: { minHeight: 60, textAlignVertical: 'top' },
  formActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, backgroundColor: '#1E1E1E', borderRadius: 10, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#2A2A2A' },
  cancelBtnText: { color: '#666666', fontSize: 14, fontWeight: '700' },
  saveBtn: { flex: 2, backgroundColor: '#F5C518', borderRadius: 10, padding: 14, alignItems: 'center' },
  saveBtnText: { color: '#0A0A0A', fontSize: 14, fontWeight: '900' },

  empty: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', marginBottom: 8 },
  emptySubtitle: { color: '#666666', fontSize: 14, textAlign: 'center', lineHeight: 20 },

  milestoneCard: {
    backgroundColor: '#161616', borderRadius: 16, padding: 16,
    marginBottom: 10, borderWidth: 1, borderColor: '#2A2A2A',
  },
  milestoneCardToday: { borderColor: '#F5C518' },
  milestoneHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  milestoneEmoji: { fontSize: 28 },
  milestoneInfo: { flex: 1 },
  milestoneLabel: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  milestoneDate: { color: '#666666', fontSize: 13, marginTop: 2 },
  milestoneDelete: { color: '#444444', fontSize: 18, padding: 4 },
  milestoneNote: { color: '#999999', fontSize: 13, fontStyle: 'italic', marginBottom: 10 },
  milestoneMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  milestoneMetaText: { color: '#666666', fontSize: 12 },
  milestoneToday: { color: '#F5C518', fontSize: 13, fontWeight: '800' },
  milestoneDaysLeft: { color: '#4CAF50', fontSize: 12, fontWeight: '600' },
});
