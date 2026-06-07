import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';
import { api } from '../services/api';

type MyIdea = {
  id: string;
  name: string;
  description: string;
  category: string;
  stage: string;
  looking_for: string[];
  interest_count: number;
  created_at: string;
};

export default function MyIdeasScreen() {
  const router = useRouter();
  const [ideas, setIdeas] = useState<MyIdea[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIdeas = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<MyIdea[]>('/ideas/mine');
      setIdeas(data);
    } catch {}
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { fetchIdeas(); }, [fetchIdeas]));

  const handleDelete = (idea: MyIdea) => {
    Alert.alert('Delete Idea', `Delete "${idea.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/ideas/${idea.id}`);
            setIdeas(prev => prev.filter(i => i.id !== idea.id));
          } catch {
            Alert.alert('Error', 'Failed to delete.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Ideas</Text>
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => router.push('/create-idea' as any)}
          activeOpacity={0.8}
        >
          <Text style={styles.newBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} size="large" color={Colors.accent} />
      ) : ideas.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>💡</Text>
          <Text style={styles.emptyTitle}>No ideas yet</Text>
          <Text style={styles.emptySub}>Post your startup idea and find co-founders.</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/create-idea' as any)} activeOpacity={0.85}>
            <Text style={styles.emptyBtnText}>Post Your First Idea</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={ideas}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ideaName}>{item.name}</Text>
                  <View style={styles.badges}>
                    <View style={styles.badge}><Text style={styles.badgeText}>{item.category}</Text></View>
                    <View style={styles.badge}><Text style={styles.badgeText}>{item.stage}</Text></View>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.interestBtn}
                  onPress={() => router.push(`/idea-interests/${item.id}` as any)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.interestCount}>{item.interest_count}</Text>
                  <Text style={styles.interestLabel}>interested</Text>
                </TouchableOpacity>
              </View>

              {!!item.description && (
                <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
              )}

              {item.looking_for.length > 0 && (
                <View style={styles.rolesRow}>
                  {item.looking_for.map(r => (
                    <View key={r} style={styles.roleTag}>
                      <Text style={styles.roleText}>{r}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => router.push({ pathname: '/create-idea', params: { ideaId: item.id, ideaData: JSON.stringify(item) } } as any)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.editBtnText}>✏️ Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(item)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.deleteBtnText}>🗑️ Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
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
  newBtn: { backgroundColor: Colors.accent, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  newBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  list: { padding: 16, gap: 14 },
  card: { backgroundColor: Colors.surface, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  ideaName: { fontWeight: '700', fontSize: 17, color: Colors.text, marginBottom: 6 },
  badges: { flexDirection: 'row', gap: 6 },
  badge: { backgroundColor: Colors.surface2, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: Colors.border },
  badgeText: { fontSize: 11, color: Colors.muted },
  interestBtn: { alignItems: 'center', backgroundColor: 'rgba(108,99,255,0.12)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(108,99,255,0.3)', minWidth: 60 },
  interestCount: { fontWeight: '800', fontSize: 20, color: Colors.accent },
  interestLabel: { fontSize: 10, color: Colors.muted, marginTop: 1 },
  desc: { fontSize: 13, color: Colors.muted, lineHeight: 19 },
  rolesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  roleTag: { backgroundColor: 'rgba(255,101,132,0.1)', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(255,101,132,0.25)' },
  roleText: { fontSize: 11, color: Colors.accent2 },
  actions: { flexDirection: 'row', gap: 10, paddingTop: 4 },
  editBtn: { flex: 1, paddingVertical: 10, borderRadius: 14, backgroundColor: Colors.surface2, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  editBtnText: { fontSize: 13, color: Colors.text, fontWeight: '600' },
  deleteBtn: { flex: 1, paddingVertical: 10, borderRadius: 14, backgroundColor: 'rgba(255,101,132,0.08)', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,101,132,0.2)' },
  deleteBtnText: { fontSize: 13, color: Colors.accent2, fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontWeight: '800', fontSize: 20, color: Colors.text, marginBottom: 8 },
  emptySub: { color: Colors.muted, fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  emptyBtn: { backgroundColor: Colors.accent, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 18 },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
