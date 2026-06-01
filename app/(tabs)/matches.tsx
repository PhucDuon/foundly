import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { useMatches } from '../../context/MatchesContext';
import { api } from '../../services/api';
import { Avatar } from '../../components/Avatar';

export default function MatchesScreen() {
  const router = useRouter();
  const { matches, fetchMatches } = useMatches();
  const [likesCount, setLikesCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      // Small delay prevents unmatched/blocked users reappearing briefly
      // due to the race between the DELETE completing and Supabase propagating it
      const id = setTimeout(() => {
        fetchMatches();
        api.get<any[]>('/matches/likes')
          .then(data => setLikesCount(data.length))
          .catch(() => {});
      }, 600);
      return () => clearTimeout(id);
    }, [fetchMatches])
  );

  const goToChat = (matchId: string) => router.push(`/chat/${matchId}` as any);

  const formatTime = (iso: string | null | undefined) => {
    if (!iso) return '';
    const date = new Date(iso);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navbar}>
        <Text style={styles.logo}>
          Found<Text style={{ color: Colors.accent }}>ly</Text>
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* Who Liked You banner */}
        {likesCount > 0 && (
          <TouchableOpacity
            style={styles.likesBanner}
            onPress={() => router.push('/likes' as any)}
            activeOpacity={0.85}
          >
            <View style={styles.likesAvatars}>
              <Text style={{ fontSize: 22 }}>💜</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.likesTitle}>
                {likesCount} {likesCount === 1 ? 'person' : 'people'} liked you
              </Text>
              <Text style={styles.likesSub}>Tap to see who and connect instantly</Text>
            </View>
            <Text style={styles.likesArrow}>›</Text>
          </TouchableOpacity>
        )}

        {matches.length === 0 && likesCount === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>💬</Text>
            <Text style={styles.emptyTitle}>No matches yet</Text>
            <Text style={styles.emptySub}>Swipe right on someone to start a conversation.</Text>
          </View>
        ) : matches.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>New Connections</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 4, gap: 14 }}
            >
              {matches.map(m => (
                <TouchableOpacity key={m.matchId} style={styles.newMatchItem} activeOpacity={0.7} onPress={() => goToChat(m.matchId)}>
                  <View style={{ position: 'relative' }}>
                    <Avatar avatarUrl={m.avatarUrl} emoji={m.emoji} size={62} borderColor={Colors.accent} />
                    <View style={styles.onlineDot} />
                  </View>
                  <Text style={styles.newMatchName}>{m.name.split(' ')[0]}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Messages</Text>
            <View style={styles.convoList}>
              {matches.map(m => (
                <TouchableOpacity key={m.matchId} style={styles.convoItem} activeOpacity={0.7} onPress={() => goToChat(m.matchId)}>
                  <Avatar avatarUrl={m.avatarUrl} emoji={m.emoji} size={52} />
                  <View style={styles.convoInfo}>
                    <Text style={styles.convoName}>{m.name}</Text>
                    <Text style={styles.convoPreview} numberOfLines={1}>{m.role}</Text>
                  </View>
                  {m.lastMessageAt && (
                    <Text style={styles.tapHint}>{formatTime(m.lastMessageAt)}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  navbar: { paddingHorizontal: 20, paddingVertical: 12 },
  logo: { fontWeight: '800', fontSize: 22, color: Colors.text },
  content: { flex: 1, paddingHorizontal: 20 },
  likesBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: 'rgba(108,99,255,0.12)',
    borderRadius: 20, padding: 16, marginBottom: 20,
    borderWidth: 1.5, borderColor: 'rgba(108,99,255,0.35)',
  },
  likesAvatars: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  likesTitle: { fontWeight: '700', fontSize: 15, color: Colors.text, marginBottom: 2 },
  likesSub: { fontSize: 12, color: Colors.muted },
  likesArrow: { fontSize: 22, color: Colors.accent },
  emptyState: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontWeight: '800', fontSize: 20, color: Colors.text, marginBottom: 8 },
  emptySub: { color: Colors.muted, fontSize: 14, textAlign: 'center', lineHeight: 22 },
  sectionTitle: { fontWeight: '700', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1.2, color: Colors.muted, marginBottom: 12 },
  newMatchItem: { alignItems: 'center', gap: 6 },
  newMatchAv: { width: 62, height: 62, borderRadius: 31, backgroundColor: Colors.surface2, alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, borderColor: Colors.accent, position: 'relative' },
  newMatchEmoji: { fontSize: 28 },
  onlineDot: { position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.green, borderWidth: 2, borderColor: Colors.bg },
  newMatchName: { fontSize: 12, color: Colors.muted },
  convoList: { gap: 2 },
  convoItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  convoAv: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.surface2, alignItems: 'center', justifyContent: 'center' },
  convoInfo: { flex: 1 },
  convoName: { fontWeight: '600', fontSize: 15, color: Colors.text, marginBottom: 2 },
  convoPreview: { fontSize: 13, color: Colors.muted },
  convoMeta: { alignItems: 'flex-end' },
  tapHint: { fontSize: 11, color: Colors.muted },
});
