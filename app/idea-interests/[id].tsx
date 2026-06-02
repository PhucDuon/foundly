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
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { api } from '../../services/api';
import { Avatar } from '../../components/Avatar';
import { useMatches } from '../../context/MatchesContext';

type InterestedUser = {
  id: string;
  name: string;
  emoji: string;
  role: string;
  bio: string;
  avatar_url: string | null;
  skills: string[];
  match_id: string | null;
};

export default function IdeaInterestsScreen() {
  const { id: ideaId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { fetchMatches } = useMatches();
  const [users, setUsers] = useState<InterestedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchMatches(); // refresh so match IDs are up to date
      api.get<InterestedUser[]>(`/ideas/${ideaId}/interests`)
        .then(setUsers)
        .catch(() => {})
        .finally(() => setLoading(false));
    }, [ideaId, fetchMatches])
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Interested ({users.length})</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} size="large" color={Colors.accent} />
      ) : users.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>👀</Text>
          <Text style={styles.emptyTitle}>No one yet</Text>
          <Text style={styles.emptySub}>Share your idea to attract co-founders.</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const matchId = item.match_id;
            return (
              <View style={styles.card}>
                <Avatar avatarUrl={item.avatar_url} emoji={item.emoji} size={56} />
                <View style={styles.info}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.role}>{item.role}</Text>
                  {!!item.bio && <Text style={styles.bio} numberOfLines={2}>{item.bio}</Text>}
                  {item.skills.length > 0 && (
                    <View style={styles.skillsRow}>
                      {item.skills.slice(0, 3).map(s => (
                        <View key={s} style={styles.skillTag}>
                          <Text style={styles.skillText}>{s}</Text>
                        </View>
                      ))}
                      {item.skills.length > 3 && (
                        <View style={styles.skillTag}>
                          <Text style={styles.skillText}>+{item.skills.length - 3}</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
                {matchId ? (
                  <TouchableOpacity
                    style={styles.chatBtn}
                    onPress={() => router.push(`/chat/${matchId}` as any)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.chatBtnText}>💬</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.acceptBtn}
                    onPress={async () => {
                      try {
                        const res = await api.post<any>(`/ideas/${ideaId}/interest`, {});
                        if (res.match?.id) router.push(`/chat/${res.match.id}` as any);
                      } catch {}
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.acceptBtnText}>Connect</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 26, color: Colors.text, lineHeight: 32, marginTop: -2 },
  title: { fontWeight: '800', fontSize: 18, color: Colors.text },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontWeight: '800', fontSize: 20, color: Colors.text, marginBottom: 8 },
  emptySub: { color: Colors.muted, fontSize: 14, textAlign: 'center' },
  list: { padding: 16, gap: 12 },
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: Colors.surface, borderRadius: 20, padding: 14, borderWidth: 1, borderColor: Colors.border },
  info: { flex: 1 },
  name: { fontWeight: '700', fontSize: 16, color: Colors.text, marginBottom: 2 },
  role: { fontSize: 13, color: Colors.accent, fontWeight: '500', marginBottom: 4 },
  bio: { fontSize: 12, color: Colors.muted, lineHeight: 18, marginBottom: 6 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  skillTag: { backgroundColor: Colors.surface2, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: Colors.border },
  skillText: { fontSize: 10, color: Colors.muted },
  chatBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  chatBtnText: { fontSize: 18 },
  acceptBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: Colors.green, alignItems: 'center', justifyContent: 'center' },
  acceptBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
});
