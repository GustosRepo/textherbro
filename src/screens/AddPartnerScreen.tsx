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
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const MASCOT_FULLBODY = require('../../assets/mascot/fullbodymascot.png');
import { savePartner, getPartner } from '../services/storage';
import { scheduleReminders } from '../services/reminders';
import { toYMD } from '../utils/date';
import { Partner, Favorites } from '../types/partner';

export default function AddPartnerScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [birthdayDate, setBirthdayDate] = useState<Date | null>(null);
  const [anniversaryDate, setAnniversaryDate] = useState<Date | null>(null);
  const [showBirthdayPicker, setShowBirthdayPicker] = useState(false);
  const [showAnniversaryPicker, setShowAnniversaryPicker] = useState(false);
  const [favorites, setFavorites] = useState<Favorites>({});
  const [isEditing, setIsEditing] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const existing = await getPartner();
      if (existing) {
        setName(existing.name);
        setNickname(existing.nickname ?? '');
        if (existing.birthday) {
          const d = new Date(existing.birthday);
          if (!isNaN(d.getTime())) setBirthdayDate(d);
        }
        if (existing.anniversary) {
          const d = new Date(existing.anniversary);
          if (!isNaN(d.getTime())) setAnniversaryDate(d);
        }
        setFavorites(existing.favorites ?? {});
        setExistingId(existing.id);
        setIsEditing(true);
      }
    })();
  }, []);

  const updateFav = (key: keyof Favorites, value: string) => {
    setFavorites((prev) => ({ ...prev, [key]: value }));
  };

  const formatDisplayDate = (date: Date | null) =>
    date ? date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null;

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Bro...', "You gotta at least tell us her name.");
      return;
    }

    const partner: Partner = {
      id: existingId ?? (Date.now().toString(36) + Math.random().toString(36).slice(2, 6)),
      name: name.trim(),
      nickname: nickname.trim() || undefined,
      birthday: birthdayDate ? toYMD(birthdayDate) : '',
      anniversary: anniversaryDate ? toYMD(anniversaryDate) : '',
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

        {/* ─── Birthday picker ─────────────────────────────────── */}
        <Text style={styles.label}>Birthday</Text>
        <TouchableOpacity
          style={[styles.input, styles.datePickerBtn]}
          onPress={() => setShowBirthdayPicker(true)}
          activeOpacity={0.7}
        >
          <Text style={formatDisplayDate(birthdayDate) ? styles.datePickerValue : styles.datePickerPlaceholder}>
            {formatDisplayDate(birthdayDate) ?? 'Tap to select a date'}
          </Text>
          {birthdayDate && (
            <TouchableOpacity
              onPress={() => setBirthdayDate(null)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.dateClearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
        <Modal visible={showBirthdayPicker} transparent animationType="slide" onRequestClose={() => setShowBirthdayPicker(false)}>
          <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setShowBirthdayPicker(false)} />
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHeader}>
              <TouchableOpacity onPress={() => { setBirthdayDate(null); setShowBirthdayPicker(false); }}>
                <Text style={styles.pickerCancelText}>Clear</Text>
              </TouchableOpacity>
              <Text style={styles.pickerTitle}>Birthday</Text>
              <TouchableOpacity onPress={() => setShowBirthdayPicker(false)}>
                <Text style={styles.pickerDoneText}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={birthdayDate ?? new Date(1995, 0, 1)}
              mode="date"
              display="spinner"
              textColor="#FFFFFF"
              maximumDate={new Date()}
              onChange={(_event, selected) => { if (selected) setBirthdayDate(selected); }}
              style={styles.picker}
            />
          </View>
        </Modal>

        {/* ─── Anniversary picker ───────────────────────────────── */}
        <Text style={styles.label}>Anniversary</Text>
        <TouchableOpacity
          style={[styles.input, styles.datePickerBtn]}
          onPress={() => setShowAnniversaryPicker(true)}
          activeOpacity={0.7}
        >
          <Text style={formatDisplayDate(anniversaryDate) ? styles.datePickerValue : styles.datePickerPlaceholder}>
            {formatDisplayDate(anniversaryDate) ?? 'Tap to select a date'}
          </Text>
          {anniversaryDate && (
            <TouchableOpacity
              onPress={() => setAnniversaryDate(null)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.dateClearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
        <Modal visible={showAnniversaryPicker} transparent animationType="slide" onRequestClose={() => setShowAnniversaryPicker(false)}>
          <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setShowAnniversaryPicker(false)} />
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHeader}>
              <TouchableOpacity onPress={() => { setAnniversaryDate(null); setShowAnniversaryPicker(false); }}>
                <Text style={styles.pickerCancelText}>Clear</Text>
              </TouchableOpacity>
              <Text style={styles.pickerTitle}>Anniversary</Text>
              <TouchableOpacity onPress={() => setShowAnniversaryPicker(false)}>
                <Text style={styles.pickerDoneText}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={anniversaryDate ?? new Date(2022, 5, 14)}
              mode="date"
              display="spinner"
              textColor="#FFFFFF"
              maximumDate={new Date()}
              onChange={(_event, selected) => { if (selected) setAnniversaryDate(selected); }}
              style={styles.picker}
            />
          </View>
        </Modal>

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
  datePickerBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  datePickerValue: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  datePickerPlaceholder: {
    color: '#444444',
    fontSize: 16,
  },
  dateClearBtn: {
    color: '#666666',
    fontSize: 16,
    paddingLeft: 8,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  pickerSheet: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  pickerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  pickerCancelText: {
    color: '#666666',
    fontSize: 16,
  },
  pickerDoneText: {
    color: '#F5C518',
    fontSize: 16,
    fontWeight: '700',
  },
  picker: {
    backgroundColor: '#1A1A1A',
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
