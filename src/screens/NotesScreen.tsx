import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  Image,
} from 'react-native';

const MASCOT_PONDERING = require('../../assets/mascot/pounderingmascot.png');
import { useFocusEffect } from '@react-navigation/native';
import { getNoteEntries, addNoteEntry, deleteNoteEntry } from '../services/storage';
import { NoteEntry, NoteCategory, NOTE_CATEGORIES } from '../types/partner';
import { canAddNote } from '../services/premium';
import { trackEvent } from '../services/analytics';
import { PaywallReason } from '../services/paywall';
import PaywallModal from '../components/PaywallModal';

export default function NotesScreen() {
  const [notes, setNotes] = useState<NoteEntry[]>([]);
  const [input, setInput] = useState('');
  const [category, setCategory] = useState<NoteCategory>('general');
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [paywallReason, setPaywallReason] = useState<PaywallReason>('general');

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const stored = await getNoteEntries();
        setNotes(stored);
      })();
    }, []),
  );

  const handleAdd = async () => {
    const text = input.trim();
    if (!text) return;

    const allowed = await canAddNote(notes.length);
    if (!allowed) {
      setPaywallReason('notes_limit');
      setPaywallVisible(true);
      return;
    }

    const updated = await addNoteEntry(text, category);
    setNotes(updated);
    setInput('');
    setCategory('general');
    trackEvent('note_added', { category });
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete note?', 'This memory will be gone forever.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updated = await deleteNoteEntry(id);
          setNotes(updated);
        },
      },
    ]);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getCategoryMeta = (cat: NoteCategory) =>
    NOTE_CATEGORIES.find((c) => c.key === cat) ?? NOTE_CATEGORIES[0];

  const renderItem = ({ item }: { item: NoteEntry }) => {
    const meta = getCategoryMeta(item.category);
    return (
      <View style={styles.noteCard}>
        <View style={styles.noteContent}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>
              {meta.emoji} {meta.label}
            </Text>
          </View>
          <Text style={styles.noteText}>{item.text}</Text>
          <Text style={styles.noteDate}>{formatDate(item.createdAt)}</Text>
        </View>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleDelete(item.id)}
        >
          <Text style={styles.deleteBtnText}>x</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Memory Bank 🧠</Text>
        <Text style={styles.subtitle}>
          Drop notes about her. Random things she says, stuff she wants, anything.
          Your suggestions get smarter the more you add.
        </Text>
      </View>

      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Image source={MASCOT_PONDERING} style={styles.emptyMascot} resizeMode="contain" />
            <Text style={styles.emptyText}>
              No notes yet. Start dropping intel, king.
            </Text>
          </View>
        }
      />

      <View style={styles.inputArea}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillRow}
        >
          {NOTE_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.pill,
                category === cat.key && styles.pillActive,
              ]}
              onPress={() => setCategory(cat.key)}
            >
              <Text
                style={[
                  styles.pillText,
                  category === cat.key && styles.pillTextActive,
                ]}
              >
                {cat.emoji} {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="She mentioned she wants..."
            placeholderTextColor="#444444"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.addBtn, !input.trim() && styles.addBtnDisabled]}
            onPress={handleAdd}
            disabled={!input.trim()}
          >
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <PaywallModal
        visible={paywallVisible}
        reason={paywallReason}
        onClose={() => setPaywallVisible(false)}
        onPurchased={() => setPaywallVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 10,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    color: '#666666',
    fontSize: 14,
    lineHeight: 20,
  },
  list: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  noteCard: {
    backgroundColor: '#161616',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  noteContent: {
    flex: 1,
  },
  noteText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 22,
  },
  noteDate: {
    color: '#444444',
    fontSize: 11,
    marginTop: 6,
  },
  deleteBtn: {
    marginLeft: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF444420',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    color: '#FF4444',
    fontSize: 14,
    fontWeight: '700',
  },
  inputArea: {
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
    paddingTop: 10,
    paddingBottom: 32,
  },
  pillRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  pillActive: {
    backgroundColor: '#F5C51820',
    borderColor: '#F5C518',
  },
  pillText: {
    color: '#666666',
    fontSize: 13,
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#F5C518',
  },
  inputRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    alignItems: 'flex-end',
    gap: 10,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F5C51815',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 6,
  },
  categoryBadgeText: {
    color: '#999999',
    fontSize: 11,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    backgroundColor: '#161616',
    borderRadius: 14,
    padding: 14,
    color: '#FFFFFF',
    fontSize: 15,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  addBtn: {
    backgroundColor: '#F5C518',
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: {
    backgroundColor: '#1E1E1E',
  },
  addBtnText: {
    color: '#0A0A0A',
    fontSize: 24,
    fontWeight: '800',
  },
  emptyMascot: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    color: '#666666',
    fontSize: 15,
    textAlign: 'center',
  },
});
