import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { CardData } from '../data/cards';
import { Avatar } from './Avatar';

type Props = {
  visible: boolean;
  card: CardData | null;
  onClose: () => void;
  onSkip: () => void;
  onConnect: () => void;
};

export function ProfileDetailModal({ visible, card, onClose, onSkip, onConnect }: Props) {
  // Keep last non-null card so it renders during fade-out animation
  const lastCard = React.useRef<CardData | null>(null);
  if (card) lastCard.current = card;
  const c = lastCard.current;

  if (!c) return null;

  const isIdea = !c.age; // ideas don't have age

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Tap backdrop to close */}
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={styles.sheet}>
          {/* Drag handle */}
          <View style={styles.handle} />

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {/* Avatar */}
            <View style={styles.avatarWrap}>
              <Avatar avatarUrl={c.avatarUrl} emoji={c.emoji} size={100} />
              {c.compatibilityScore !== undefined && (
                <View style={[
                  styles.scoreBadge,
                  c.compatibilityScore >= 70 ? styles.scoreHigh :
                  c.compatibilityScore >= 40 ? styles.scoreMid : styles.scoreLow,
                ]}>
                  <Text style={styles.scoreText}>⚡ {c.compatibilityScore}% match</Text>
                </View>
              )}
            </View>

            {/* Name + role */}
            <Text style={styles.name}>
              {c.name}{c.age ? `, ${c.age}` : ''}
            </Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{c.role}</Text>
            </View>

            {/* Bio */}
            {!!c.bio && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{isIdea ? 'Elevator Pitch' : 'About'}</Text>
                <Text style={styles.bioText}>{c.bio}</Text>
              </View>
            )}

            {/* Skills */}
            {c.skills.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{isIdea ? 'Looking For' : 'Skills'}</Text>
                <View style={styles.chipsWrap}>
                  {c.skills.map(s => (
                    <View key={s} style={styles.chip}>
                      <Text style={styles.chipText}>{s}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={{ height: 16 }} />
          </ScrollView>

          {/* Action buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.btnSkip}
              onPress={() => { onClose(); onSkip(); }}
              activeOpacity={0.8}
            >
              <Text style={styles.btnSkipText}>✕  Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnConnect}
              onPress={() => { onClose(); onConnect(); }}
              activeOpacity={0.85}
            >
              <Text style={styles.btnConnectText}>💜  Connect</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.muted,
    alignSelf: 'center', marginTop: 12, marginBottom: 4,
    opacity: 0.4,
  },
  content: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  avatarWrap: { alignItems: 'center', marginBottom: 16, gap: 10 },
  scoreBadge: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1,
  },
  scoreHigh: { backgroundColor: 'rgba(0,212,170,0.12)', borderColor: 'rgba(0,212,170,0.4)' },
  scoreMid:  { backgroundColor: 'rgba(108,99,255,0.12)', borderColor: 'rgba(108,99,255,0.4)' },
  scoreLow:  { backgroundColor: Colors.surface2, borderColor: Colors.border },
  scoreText: { fontSize: 12, fontWeight: '700', color: Colors.text },
  name: { fontWeight: '800', fontSize: 26, color: Colors.text, textAlign: 'center', marginBottom: 8 },
  roleBadge: {
    backgroundColor: 'rgba(108,99,255,0.18)',
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, alignSelf: 'center', marginBottom: 20,
  },
  roleText: { fontSize: 13, fontWeight: '600', color: Colors.accent, textTransform: 'uppercase', letterSpacing: 0.5 },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: Colors.muted,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10,
  },
  bioText: { fontSize: 15, color: 'rgba(240,240,245,0.8)', lineHeight: 24 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: Colors.surface2, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: Colors.border,
  },
  chipText: { fontSize: 13, color: Colors.muted },
  actions: {
    flexDirection: 'row', gap: 12,
    paddingHorizontal: 24, paddingVertical: 20,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  btnSkip: {
    flex: 1, paddingVertical: 15, borderRadius: 18,
    alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border,
  },
  btnSkipText: { color: Colors.muted, fontWeight: '600', fontSize: 15 },
  btnConnect: {
    flex: 2, paddingVertical: 15, borderRadius: 18,
    alignItems: 'center', backgroundColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 5,
  },
  btnConnectText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
