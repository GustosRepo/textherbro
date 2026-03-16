import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';

const MASCOT_FULLBODY = require('../../assets/mascot/fullbodymascot.png');
import { savePartner, getPartner } from '../services/storage';
import { scheduleReminders } from '../services/reminders';
import { isValidDateString } from '../utils/date';
import { Partner, Favorites } from '../types/partner';

export default function AddPartnerScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [birthday, setBirthday] = useState('');
  const [anniversary, setAnniversary] = useState('');
  const [favorites, setFavorites] = useState<Favorites>({});
  const [isEditing, setIsEditing] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const existing = await getPartner();
      if (existing) {
        setName(existing.name);
        setNickname(existing.nickname ?? '');
        setBirthday(existing.birthday);
        setAnniversary(existing.anniversary);
        setFavorites(existing.favorites ?? {});
        setExistingId(existing.id);
        setIsEditing(true);
      }
    })();
  }, []);

  const updateFav = (key: keyof Favorites, value: string) => {
    setFavorites((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Bro...', "You gotta at least tell us her name.");
      return;
    }

    if (birthday && !isValidDateString(birthday)) {
      Alert.alert('Invalid Date', 'Birthday should be YYYY-MM-DD format with a real date.');
      return;
    }

    if (anniversary && !isValidDateString(anniversary)) {
      Alert.alert('Invalid Date', 'Anniversary should be YYYY-MM-DD format with a real date.');
      return;
    }

    const partner: Partner = {
      id: existingId ?? (Date.now().toString(36) + Math.random().toString(36).slice(2, 6)),
      name: name.trim(),
      nickname: nickname.trim() || undefined,
      birthday,
      anniversary,
      favorites,
    };

    await savePartner(partner);

    try {
      await scheduleReminders();
    } catch {
      // Notifications may not be available in simulator
    }

    Alert.alert(
      'Saved \uD83D\uDC51',
      isEditing
        ? `${partner.name}'s info updated.`
        : `Nice. We'll help you stay on top of things with ${partner.name}.`,
      [{ text: "Let's go", onPress: () => navigation.goBack() }],
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Image source={MASCOT_FULLBODY} style={styles.headerMascot} resizeMode="contain" />
        <Text style={styles.title}>
          {isEditing ? 'Edit Partner' : 'Add Your Girl'}
        </Text>
        <Text style={styles.subtitle}>
          {isEditing
            ? 'Update the details, king.'
            : "Let's get the basics down so you don't fumble."}
        </Text>

        {/* ─── Basics ──────────────────────────────────────────── */}
        <Text style={styles.sectionHeader}>Basics</Text>

        <Text style={styles.label}>Her Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Jessica"
          placeholderTextColor="#444444"
        />

        <Text style={styles.label}>Nickname</Text>
        <TextInput
          style={styles.input}
          value={nickname}
          onChangeText={setNickname}
          placeholder="e.g. Jess, babe, mi amor"
          placeholderTextColor="#444444"
        />

        <Text style={styles.label}>Birthday</Text>
        <TextInput
          style={styles.input}
          value={birthday}
          onChangeText={setBirthday}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#444444"
          keyboardType="numbers-and-punctuation"
        />

        <Text style={styles.label}>Anniversary</Text>
        <TextInput
          style={styles.input}
          value={anniversary}
          onChangeText={setAnniversary}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#444444"
          keyboardType="numbers-and-punctuation"
        />

        {/* ─── Favorites ───────────────────────────────────────── */}
        <Text style={[styles.sectionHeader, { marginTop: 32 }]}>
          Her Favorites
        </Text>
        <Text style={styles.sectionSubtext}>
          The more you fill in, the better your daily suggestions get.
        </Text>

        <Text style={styles.label}>Food</Text>
        <TextInput
          style={styles.input}
          value={favorites.food ?? ''}
          onChangeText={(v) => updateFav('food', v)}
          placeholder="e.g. Sushi, pasta, tacos"
          placeholderTextColor="#444444"
        />

        <Text style={styles.label}>Flowers</Text>
        <TextInput
          style={styles.input}
          value={favorites.flowers ?? ''}
          onChangeText={(v) => updateFav('flowers', v)}
          placeholder="e.g. Sunflowers, roses"
          placeholderTextColor="#444444"
        />

        <Text style={styles.label}>Restaurant</Text>
        <TextInput
          style={styles.input}
          value={favorites.restaurant ?? ''}
          onChangeText={(v) => updateFav('restaurant', v)}
          placeholder="e.g. That Italian spot on 5th"
          placeholderTextColor="#444444"
        />

        <Text style={styles.label}>Color</Text>
        <TextInput
          style={styles.input}
          value={favorites.color ?? ''}
          onChangeText={(v) => updateFav('color', v)}
          placeholder="e.g. Sage green, lavender"
          placeholderTextColor="#444444"
        />

        <Text style={styles.label}>Brand</Text>
        <TextInput
          style={styles.input}
          value={favorites.brand ?? ''}
          onChangeText={(v) => updateFav('brand', v)}
          placeholder="e.g. Nike, Zara, Glossier"
          placeholderTextColor="#444444"
        />

        <Text style={styles.label}>Music</Text>
        <TextInput
          style={styles.input}
          value={favorites.music ?? ''}
          onChangeText={(v) => updateFav('music', v)}
          placeholder="e.g. R&B, Taylor Swift, jazz"
          placeholderTextColor="#444444"
        />

        <Text style={styles.label}>Hobby</Text>
        <TextInput
          style={styles.input}
          value={favorites.hobby ?? ''}
          onChangeText={(v) => updateFav('hobby', v)}
          placeholder="e.g. Yoga, painting, reading"
          placeholderTextColor="#444444"
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>
            {isEditing ? 'Update' : 'Save'} Partner
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  headerMascot: {
    width: 100,
    height: 100,
    marginBottom: 16,
    alignSelf: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    color: '#666666',
    fontSize: 15,
    marginBottom: 30,
  },
  sectionHeader: {
    color: '#F5C518',
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  sectionSubtext: {
    color: '#666666',
    fontSize: 13,
    marginBottom: 8,
  },
  label: {
    color: '#999999',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#161616',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  saveButton: {
    backgroundColor: '#F5C518',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  saveButtonText: {
    color: '#0A0A0A',
    fontSize: 16,
    fontWeight: '800',
  },
});
