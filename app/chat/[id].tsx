import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../constants/Colors';
import { Message, useMatches } from '../../context/MatchesContext';
import { useAuth } from '../../context/AuthContext';
import { api, BASE_URL, getAuthToken } from '../../services/api';
import { supabase } from '../../services/supabase';
import { Avatar } from '../../components/Avatar';

const IMAGE_PREFIX = '__img__:';

type ListItem =
  | (Message & { _type?: 'message' })
  | { _type: 'separator'; label: string; id: string };

function isSameDay(a: number, b: number) {
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate();
}

function formatSeparator(ts: number): string {
  const date = new Date(ts);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(ts, today.getTime())) return 'Today';
  if (isSameDay(ts, yesterday.getTime())) return 'Yesterday';
  return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function buildListItems(messages: Message[]): ListItem[] {
  const items: ListItem[] = [];
  messages.forEach((msg, i) => {
    const prev = messages[i - 1];
    if (!prev || !isSameDay(prev.sentAt, msg.sentAt)) {
      items.push({ _type: 'separator', label: formatSeparator(msg.sentAt), id: `sep_${msg.sentAt}` });
    }
    items.push(msg);
  });
  return items;
}

export default function ChatScreen() {
  const { id: matchId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useAuth();
  const { matches } = useMatches();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const listRef = useRef<FlatList<ListItem>>(null);

  const matchEntry = matches.find(m => m.matchId === matchId);
  const displayName = matchEntry?.name ?? 'Match';
  const displayEmoji = matchEntry?.emoji ?? '🤝';

  const loadMessages = useCallback(async () => {
    if (!matchId || !profile) return;
    try {
      const data = await api.get<any[]>(`/messages/${matchId}`);
      setMessages(data.map(m => ({
        id: m.id,
        text: m.content,
        fromMe: m.sender_id === profile.id,
        sentAt: new Date(m.sent_at).getTime(),
      })));
    } catch {}
  }, [matchId, profile]);

  useEffect(() => {
    if (!matchId || !profile) return;

    // Initial load
    loadMessages();

    // Subscribe to new messages in real-time
    const channel = supabase
      .channel(`chat:${matchId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` },
        (payload) => {
          const m = payload.new as any;
          setMessages(prev => {
            // Skip if we already have it (optimistic update)
            if (prev.some(msg => msg.id === m.id)) return prev;
            return [...prev, {
              id: m.id,
              text: m.content,
              fromMe: m.sender_id === profile.id,
              sentAt: new Date(m.sent_at).getTime(),
            }];
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [matchId, profile]);

  useEffect(() => {
    if (messages.length > 0) {
      listRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

  const sendText = useCallback(async () => {
    const text = input.trim();
    if (!text || !matchId) return;
    setInput('');

    const tempId = `temp_${Date.now()}`;
    setMessages(prev => [...prev, { id: tempId, text, fromMe: true, sentAt: Date.now() }]);

    try {
      const sent = await api.post<any>(`/messages/${matchId}`, { content: text });
      setMessages(prev => prev.map(m =>
        m.id === tempId
          ? { id: sent.id, text: sent.content, fromMe: true, sentAt: new Date(sent.sent_at).getTime() }
          : m
      ));
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  }, [input, matchId]);

  const sendImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    setUploading(true);
    const tempId = `temp_img_${Date.now()}`;
    const localUri = result.assets[0].uri;

    // Optimistic preview
    setMessages(prev => [...prev, {
      id: tempId,
      text: `${IMAGE_PREFIX}${localUri}`,
      fromMe: true,
      sentAt: Date.now(),
    }]);

    try {
      const formData = new FormData();
      formData.append('file', { uri: localUri, type: 'image/jpeg', name: 'photo.jpg' } as any);
      const res = await fetch(`${BASE_URL}/messages/upload/image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getAuthToken()}` },
        body: formData,
      });
      const { url } = await res.json();

      const sent = await api.post<any>(`/messages/${matchId}`, { content: `${IMAGE_PREFIX}${url}` });
      setMessages(prev => prev.map(m =>
        m.id === tempId
          ? { id: sent.id, text: sent.content, fromMe: true, sentAt: new Date(sent.sent_at).getTime() }
          : m
      ));
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      Alert.alert('Upload failed', 'Could not send image.');
    } finally {
      setUploading(false);
    }
  }, [matchId]);

  const listItems = buildListItems(messages);

  const renderItem = ({ item, index }: { item: ListItem; index: number }) => {
    if (item._type === 'separator') {
      return (
        <View style={styles.dateSepWrap}>
          <View style={styles.dateSepLine} />
          <Text style={styles.dateSepText}>{item.label}</Text>
          <View style={styles.dateSepLine} />
        </View>
      );
    }

    const msg = item as Message;
    const prevItem = index > 0 ? listItems[index - 1] : null;
    const prevRegMsg = prevItem && !('label' in prevItem) ? (prevItem as Message) : null;
    const showAvatar = !msg.fromMe && (!prevRegMsg || prevRegMsg.fromMe);
    const isImage = msg.text.startsWith(IMAGE_PREFIX);
    const imageUrl = isImage ? msg.text.replace(IMAGE_PREFIX, '') : null;

    return (
      <View style={[styles.bubbleRow, msg.fromMe ? styles.bubbleRowMe : styles.bubbleRowThem]}>
        {!msg.fromMe && (
          <View style={{ opacity: showAvatar ? 1 : 0 }}>
            <Avatar avatarUrl={matchEntry?.avatarUrl} emoji={displayEmoji} size={28} />
          </View>
        )}
        <View style={styles.bubbleCol}>
          <View style={[styles.bubble, msg.fromMe ? styles.bubbleMe : styles.bubbleThem, isImage && styles.bubbleImage]}>
            {isImage && imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={styles.chatImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={[styles.bubbleText, msg.fromMe && styles.bubbleTextMe]}>
                {msg.text}
              </Text>
            )}
          </View>
          <Text style={[styles.bubbleTime, msg.fromMe && { textAlign: 'right' }]}>
            {formatTime(msg.sentAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Avatar avatarUrl={matchEntry?.avatarUrl} emoji={displayEmoji} size={42} borderColor={Colors.accent} />
          <View>
            <Text style={styles.headerName}>{displayName}</Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Online</Text>
            </View>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <FlatList
          ref={listRef}
          data={listItems}
          keyExtractor={item => ('label' in item ? item.id : (item as Message).id)}
          contentContainerStyle={[styles.listContent, listItems.length === 0 && { flex: 1 }]}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Avatar avatarUrl={matchEntry?.avatarUrl} emoji={displayEmoji} size={90} borderColor={Colors.accent} />
              <Text style={styles.emptyName}>{displayName}</Text>
              {matchEntry?.role ? <Text style={styles.emptyRole}>{matchEntry.role}</Text> : null}
              <Text style={styles.emptySub}>You matched! Say hello 👋</Text>
            </View>
          }
          renderItem={renderItem}
        />

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TouchableOpacity
            style={[styles.iconBtn, uploading && { opacity: 0.4 }]}
            onPress={sendImage}
            disabled={uploading}
            activeOpacity={0.7}
          >
            <Image
              source={require('../../assets/camera-icon.png')}
              style={{ width: 26, height: 26 }}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={`Message ${displayName.split(' ')[0]}...`}
            placeholderTextColor={Colors.muted}
            returnKeyType="send"
            onSubmitEditing={sendText}
            blurOnSubmit={false}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
            onPress={sendText}
            disabled={!input.trim()}
            activeOpacity={0.8}
          >
            <Text style={styles.sendIcon}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 28, color: Colors.text, lineHeight: 34, marginTop: -2 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  headerName: { fontWeight: '700', fontSize: 16, color: Colors.text },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  onlineDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: Colors.green },
  onlineText: { fontSize: 11, color: Colors.green },
  listContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 8 },
  emptyName: { fontWeight: '700', fontSize: 18, color: Colors.text },
  emptyRole: { fontSize: 13, color: Colors.muted },
  emptySub: { fontSize: 14, color: Colors.muted, marginTop: 8 },
  dateSepWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 16 },
  dateSepLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dateSepText: { fontSize: 12, color: Colors.muted, fontWeight: '500' },
  bubbleRow: { flexDirection: 'row', marginBottom: 6, alignItems: 'flex-end', gap: 8 },
  bubbleRowMe: { justifyContent: 'flex-end' },
  bubbleRowThem: { justifyContent: 'flex-start' },
  bubbleCol: { maxWidth: '72%' },
  bubble: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMe: { backgroundColor: Colors.accent, borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: Colors.surface2, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: Colors.border },
  bubbleImage: { padding: 0, paddingHorizontal: 0, paddingVertical: 0, overflow: 'hidden' },
  chatImage: { width: 220, height: 220, borderRadius: 20 },
  bubbleText: { fontSize: 14, lineHeight: 20, color: Colors.muted },
  bubbleTextMe: { color: '#fff' },
  bubbleTime: { fontSize: 10, color: Colors.muted, marginTop: 3, paddingHorizontal: 4 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.bg },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  input: { flex: 1, backgroundColor: Colors.surface, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: Colors.text, maxHeight: 120, borderWidth: 1, borderColor: Colors.border },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5 },
  sendBtnDisabled: { backgroundColor: Colors.surface2, shadowOpacity: 0 },
  sendIcon: { fontSize: 20, color: '#fff', fontWeight: '700' },
});
