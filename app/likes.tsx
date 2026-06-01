import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';
import { api } from '../services/api';
import { useMatches } from '../context/MatchesContext';
import { Avatar } from '../components/Avatar';

type LikeProfile = {
  id: string;
  name: string;
  emoji: string;
  role: string;
  bio: string;
  skills: string[];
  experience_level: string;
  location: string;
  compatibility_score: number;
  avatar_url: string | null;
};

export default function LikesScreen() {
  const router = useRouter();
  const { addMatch } = useMatches();
  const [likes, setLikes] = useState<LikeProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  const fetchLikes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<LikeProfile[]>('/matches/likes');
      setLikes(data);
    } catch {}
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { fetchLikes(); }, [fetchLikes]));

  const handleConnect = async (person: LikeProfile) => {
    setConnecting(person.id);
    try {
      const res = await api.post<any>('/matches/swipe', {
        swiped_id: person.id,
        direction: 'right',
      });
      if (res.matched && res.match) {
        addMatch({
          matchId: res.match.id,
          userId: person.id,
          name: person.name,
          emoji: person.emoji,
          role: person.role,
          bio: person.bio,
        });
        setLikes(prev => prev.filter(p => p.id !== person.id));
        router.push(`/chat/${res.match.id}` as any);
      }
    } catch {}
    setConnecting(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Who Liked You</Text>
          {!loading && <Text style={styles.subtitle}>{likes.length} pending {likes.length === 1 ? 'connection' : 'connections'}</Text>}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} size="large" color={Colors.accent} />
      ) : likes.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>💜</Text>
          <Text style={styles.emptyTitle}>No new likes yet</Text>
          <Text style={styles.emptySub}>Keep swiping — people who like you will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={likes}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.card}>
              {/* Avatar + score */}
              <View style={styles.cardTop}>
                <Avatar avatarUrl={item.avatar_url} emoji={item.emoji} size={62} />
                <View style={styles.cardInfo}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.role}>{item.role}</Text>
                  {item.location ? <Text style={styles.location}>📍 {item.location}</Text> : null}
                </View>
                <View style={[
                  styles.scoreBadge,
                  item.compatibility_score >= 70 ? styles.scoreHigh :
                  item.compatibility_score >= 40 ? styles.scoreMid : styles.scoreLow,
                ]}>
                  <Text style={styles.scoreText}>⚡ {item.compatibility_score}%</Text>
                </View>
              </View>

              {!!item.bio && (
                <Text style={styles.bio} numberOfLines={2}>{item.bio}</Text>
              )}

              {item.skills.length > 0 && (
                <View style={styles.skillsRow}>
                  {item.skills.slice(0, 4).map(s => (
                    <View key={s} style={styles.skillTag}>
                      <Text style={styles.skillText}>{s}</Text>
                    </View>
                  ))}
                  {item.skills.length > 4 && (
                    <View style={styles.skillTag}>
                      <Text style={styles.skillText}>+{item.skills.length - 4}</Text>
                    </View>
                  )}
                </View>
              )}

              <TouchableOpacity
                style={[styles.connectBtn, connecting === item.id && { opacity: 0.6 }]}
                onPress={() => handleConnect(item)}
                disabled={connecting === item.id}
                activeOpacity={0.85}
              >
                {connecting === item.id
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.connectBtnText}>💜 Connect</Text>
                }
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 26, color: Colors.text, lineHeight: 32, marginTop: -2 },
  title: { fontWeight: '800', fontSize: 18, color: Colors.text },
  subtitle: { fontSize: 12, color: Colors.muted, marginTop: 1 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontWeight: '800', fontSize: 20, color: Colors.text, marginBottom: 8 },
  emptySub: { color: Colors.muted, fontSize: 14, textAlign: 'center', lineHeight: 22 },
  list: { padding: 16, gap: 14 },
  card: {
    backgroundColor: Colors.surface, borderRadius: 24,
    padding: 18, borderWidth: 1, borderColor: Colors.border,
    gap: 12,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 62, height: 62, borderRadius: 31,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  name: { fontWeight: '700', fontSize: 17, color: Colors.text, marginBottom: 2 },
  role: { fontSize: 13, color: Colors.accent, fontWeight: '500' },
  location: { fontSize: 12, color: Colors.muted, marginTop: 2 },
  scoreBadge: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
    borderWidth: 1,
  },
  scoreHigh: { backgroundColor: 'rgba(0,212,170,0.12)', borderColor: 'rgba(0,212,170,0.35)' },
  scoreMid:  { backgroundColor: 'rgba(108,99,255,0.12)', borderColor: 'rgba(108,99,255,0.35)' },
  scoreLow:  { backgroundColor: Colors.surface2, borderColor: Colors.border },
  scoreText: { fontSize: 11, fontWeight: '700', color: Colors.text },
  bio: { fontSize: 13, color: Colors.muted, lineHeight: 20 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  skillTag: {
    backgroundColor: Colors.surface2, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.border,
  },
  skillText: { fontSize: 11, color: Colors.muted },
  connectBtn: {
    backgroundColor: Colors.accent, borderRadius: 16,
    paddingVertical: 13, alignItems: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 5,
  },
  connectBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
