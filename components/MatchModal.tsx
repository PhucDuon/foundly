import React, { useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { CardData } from '../data/cards';
import { Avatar } from './Avatar';
import { useAuth } from '../context/AuthContext';

type Props = {
  visible: boolean;
  card: CardData | null;
  onClose: (goChat?: boolean) => void;
};

export function MatchModal({ visible, card, onClose }: Props) {
  const { profile } = useAuth();

  // Keep last non-null card so the Modal can play its fade-out animation before unmounting
  const lastCard = useRef<CardData | null>(null);
  if (card) lastCard.current = card;
  const displayCard = lastCard.current;

  if (!displayCard) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.emoji}>🎉</Text>
          <Text style={styles.title}>
            It's a <Text style={{ color: Colors.accent }}>Match!</Text>
          </Text>
          <Text style={styles.sub}>
            You and{' '}
            <Text style={{ fontWeight: '700', color: Colors.text }}>{displayCard.name}</Text>{' '}
            both want to collaborate. Say hello! 👋
          </Text>

          {/* Avatars — your photo overlapping theirs */}
          <View style={styles.avatars}>
            <View style={[styles.avatarWrap, { marginRight: -14, zIndex: 1 }]}>
              <Avatar
                avatarUrl={profile?.avatarUrl}
                emoji={profile?.emoji ?? '🧑‍💻'}
                size={70}
                borderColor={Colors.bg}
              />
            </View>
            <View style={styles.avatarWrap}>
              <Avatar
                avatarUrl={displayCard.avatarUrl}
                emoji={displayCard.emoji}
                size={70}
                borderColor={Colors.bg}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.btnChat} onPress={() => onClose(true)} activeOpacity={0.85}>
            <Text style={styles.btnChatText}>💬 Send a Message</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnKeep} onPress={() => onClose(false)} activeOpacity={0.7}>
            <Text style={styles.btnKeepText}>Keep Swiping</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10,10,15,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    width: 320,
    backgroundColor: Colors.surface,
    borderRadius: 32,
    padding: 36,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emoji: { fontSize: 56, marginBottom: 12 },
  title: { fontWeight: '800', fontSize: 28, color: Colors.text, marginBottom: 6 },
  sub: {
    color: Colors.muted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  avatars: { flexDirection: 'row', marginBottom: 24 },
  avatarWrap: {
    borderRadius: 35,
    borderWidth: 3,
    borderColor: Colors.bg,
    overflow: 'hidden',
  },
  btnChat: {
    width: '100%',
    backgroundColor: Colors.accent,
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 10,
  },
  btnChatText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  btnKeep: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  btnKeepText: { color: Colors.muted, fontSize: 14 },
});
