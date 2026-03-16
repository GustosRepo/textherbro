/**
 * PartnerSwitcherCard — Shows active partner with ability to switch or add new.
 * Multiple partners is a PRO feature.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Partner } from '../types/partner';

interface PartnerSwitcherCardProps {
  partners: Partner[];
  activePartnerId: string | null;
  isPro: boolean;
  onSwitch: (partnerId: string) => void;
  onAddNew: () => void;
  onDeletePartner: (partnerId: string) => void;
  onUpgrade: () => void;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');
}

export default function PartnerSwitcherCard({
  partners,
  activePartnerId,
  isPro,
  onSwitch,
  onAddNew,
  onDeletePartner,
  onUpgrade,
}: PartnerSwitcherCardProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const active = partners.find((p) => p.id === activePartnerId) ?? partners[0];

  if (!active || partners.length <= 1) {
    // Only show switcher if there are multiple partners or user is PRO (they can add)
    if (!isPro) return null;
  }

  const handleAddNew = () => {
    if (!isPro) {
      setModalVisible(false);
      onUpgrade();
      return;
    }
    setModalVisible(false);
    onAddNew();
  };

  const handleSwitch = (id: string) => {
    Haptics.selectionAsync();
    onSwitch(id);
    setModalVisible(false);
  };

  const handleDelete = (partner: Partner) => {
    if (partners.length <= 1) {
      Alert.alert("Can't delete your only partner.");
      return;
    }
    Alert.alert(
      `Remove ${partner.name}?`,
      'Their data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDeletePartner(partner.id);
            setModalVisible(false);
          },
        },
      ],
    );
  };

  if (!active) return null;

  return (
    <>
      <TouchableOpacity
        style={styles.card}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.85}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(active.name)}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.infoName}>{active.nickname || active.name}</Text>
          {active.nickname && (
            <Text style={styles.infoSub}>{active.name}</Text>
          )}
        </View>
        <View style={styles.switchBtn}>
          <Text style={styles.switchBtnText}>
            {partners.length > 1 ? 'Switch ↕' : '+ Add'}
          </Text>
        </View>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Your Partners</Text>

            <FlatList
              data={partners}
              keyExtractor={(p) => p.id}
              scrollEnabled={false}
              renderItem={({ item }) => {
                const isActive = item.id === activePartnerId;
                return (
                  <TouchableOpacity
                    style={[styles.partnerRow, isActive && styles.partnerRowActive]}
                    onPress={() => handleSwitch(item.id)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.rowAvatar, isActive && styles.rowAvatarActive]}>
                      <Text style={[styles.rowAvatarText, isActive && styles.rowAvatarTextActive]}>
                        {getInitials(item.name)}
                      </Text>
                    </View>
                    <View style={styles.rowInfo}>
                      <Text style={styles.rowName}>{item.nickname || item.name}</Text>
                      {item.nickname && <Text style={styles.rowSub}>{item.name}</Text>}
                    </View>
                    {isActive ? (
                      <Text style={styles.activeCheckmark}>✓</Text>
                    ) : (
                      <TouchableOpacity
                        onPress={(e) => { e.stopPropagation(); handleDelete(item); }}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Text style={styles.rowDelete}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                );
              }}
            />

            <TouchableOpacity style={styles.addNewBtn} onPress={handleAddNew}>
              {!isPro && <Text style={styles.addNewLock}>🔒 </Text>}
              <Text style={styles.addNewBtnText}>
                {isPro ? '+ Add Another Partner' : '+ Add Another Partner (PRO)'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161616',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5C51820',
    borderWidth: 1.5,
    borderColor: '#F5C518',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#F5C518', fontSize: 14, fontWeight: '900' },
  info: { flex: 1 },
  infoName: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  infoSub: { color: '#666666', fontSize: 12, marginTop: 1 },
  switchBtn: {
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#333333',
  },
  switchBtnText: { color: '#F5C518', fontSize: 12, fontWeight: '800' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#161616',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: '#2A2A2A',
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#333333', alignSelf: 'center', marginBottom: 16,
  },
  sheetTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', marginBottom: 16 },

  partnerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1E1E1E',
  },
  partnerRowActive: { opacity: 1 },
  rowAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#1E1E1E', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#2A2A2A',
  },
  rowAvatarActive: { borderColor: '#F5C518', backgroundColor: '#F5C51815' },
  rowAvatarText: { color: '#666666', fontSize: 14, fontWeight: '900' },
  rowAvatarTextActive: { color: '#F5C518' },
  rowInfo: { flex: 1 },
  rowName: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  rowSub: { color: '#666666', fontSize: 12, marginTop: 1 },
  activeCheckmark: { color: '#4CAF50', fontSize: 18, fontWeight: '900' },
  rowDelete: { color: '#444444', fontSize: 18 },

  addNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    backgroundColor: '#F5C518',
    borderRadius: 14,
    padding: 16,
  },
  addNewLock: { fontSize: 14 },
  addNewBtnText: { color: '#0A0A0A', fontSize: 15, fontWeight: '900' },
  cancelBtn: {
    marginTop: 10,
    alignItems: 'center',
    padding: 14,
  },
  cancelBtnText: { color: '#666666', fontSize: 14, fontWeight: '700' },
});
