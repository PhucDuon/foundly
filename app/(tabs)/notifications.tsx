import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Avatar } from '../../components/Avatar';
import { api } from '../../services/api';

const LAST_SEEN_KEY = 'notifications_last_seen';

type Notification = {
  id: string;
  type: 'match' | 'interest' | 'message';
  actor_name: string;
  actor_avatar: string | null;
  body: string;
  match_id: string | null;
  created_at: string;
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const TYPE_META: Record<string, { icon: string; label: string; color: string }> = {
  match:    { icon: '💜', label: 'Match',    color: Colors.accent },
  interest: { icon: '💡', label: 'Interest', color: Colors.green },
  message:  { icon: '💬', label: 'Message',  color: '#ff9f43' },
};

export default function NotificationsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSeen, setLastSeen] = useState<Date | null>(null);
  const justFocused = useRef(false);

  useFocusEffect(
    useCallback(() => {
      justFocused.current = true;
      setLoading(true);

      AsyncStorage.getItem(LAST_SEEN_KEY).then(val => {
        setLastSeen(val ? new Date(val) : null);
      });

      api.get<Notification[]>('/notifications')
        .then(setItems)
        .catch(() => {})
        .finally(() => setLoading(false));

      // Mark all as seen when leaving the tab
      return () => {
        if (justFocused.current) {
          const now = new Date().toISOString();
          AsyncStorage.setItem(LAST_SEEN_KEY, now);
          justFocused.current = false;
        }
      };
    }, [])
  );

  const handleTap = (item: Notification) => {
    if (item.match_id) {
      router.push(`/chat/${item.match_id}` as any);
    }
  };

  const isNew = (item: Notification) =>
    lastSeen === null || new Date(item.created_at) > lastSeen;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navbar}>
        <Text style={styles.logo}>
          Found<Text style={{ color: Colors.accent }}>ly</Text>
        </Text>
        <Text style={styles.navTitle}>Activity</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} size="large" color={Colors.accent} />
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🔔</Text>
          <Text style={styles.emptyTitle}>No activity yet</Text>
          <Text style={styles.emptySub}>
            Matches, messages, and idea interests will show up here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const meta = TYPE_META[item.type];
            const fresh = isNew(item);
            return (
              <TouchableOpacity
                style={[styles.card, fresh && styles.cardNew]}
                onPress={() => handleTap(item)}
                activeOpacity={item.match_id ? 0.75 : 1}
              >
                <View style={styles.avatarWrap}>
                  <Avatar avatarUrl={item.actor_avatar} emoji="🚀" size={48} />
                  <View style={[styles.typeDot, { backgroundColor: meta.color }]}>
                    <Text style={styles.typeDotIcon}>{meta.icon}</Text>
                  </View>
                </View>

                <View style={styles.content}>
                  <View style={styles.topRow}>
                    <Text style={[styles.typeLabel, { color: meta.color }]}>{meta.label}</Text>
                    <Text style={styles.time}>{timeAgo(item.created_at)}</Text>
                  </View>
                  <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
                </View>

                {fresh && <View style={styles.newDot} />}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  navbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  logo: { fontWeight: '800', fontSize: 22, color: Colors.text, width: 80 },
  navTitle: { fontWeight: '800', fontSize: 18, color: Colors.text },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyEmoji: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontWeight: '800', fontSize: 20, color: Colors.text, marginBottom: 8 },
  emptySub: { color: Colors.muted, fontSize: 14, textAlign: 'center', lineHeight: 22 },
  list: { padding: 16, gap: 10 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surface, borderRadius: 20,
    padding: 14, borderWidth: 1, borderColor: Colors.border,
  },
  cardNew: {
    borderColor: 'rgba(108,99,255,0.35)',
    backgroundColor: 'rgba(108,99,255,0.06)',
  },
  avatarWrap: { position: 'relative' },
  typeDot: {
    position: 'absolute', bottom: -2, right: -4,
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.bg,
  },
  typeDotIcon: { fontSize: 11 },
  content: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
  typeLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  time: { fontSize: 11, color: Colors.muted },
  body: { fontSize: 13, color: Colors.text, lineHeight: 19 },
  newDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.accent, flexShrink: 0,
  },
});
