import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../../components/Avatar';
import { api } from '../../services/api';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={sectionStyles.container}>
      <Text style={sectionStyles.title}>{title}</Text>
      {children}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  container: { paddingHorizontal: 20, marginBottom: 20 },
  title: {
    fontWeight: '700', fontSize: 13, textTransform: 'uppercase',
    letterSpacing: 1, color: Colors.muted, marginBottom: 10,
  },
});

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, logout } = useAuth();
  const [ideasCount, setIdeasCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      api.get<any[]>('/ideas/mine').then(data => setIdeasCount(data.length)).catch(() => {});
    }, [])
  );

  if (!profile) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navbar}>
        <Text style={styles.logo}>
          Found<Text style={{ color: Colors.accent }}>ly</Text>
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/edit-profile')} activeOpacity={0.7}>
            <Text style={{ fontSize: 18 }}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={logout} activeOpacity={0.7}>
            <Text style={{ fontSize: 18 }}>🚪</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <Avatar avatarUrl={profile.avatarUrl} emoji={profile.emoji} size={80} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{profile.name}</Text>
            <Text style={styles.role}>
              {profile.role}{profile.experienceLevel ? ` · ${profile.experienceLevel}` : ''}
            </Text>
            {!!profile.location && <Text style={styles.loc}>📍 {profile.location}</Text>}
          </View>
        </View>

        {!!profile.bio && (
          <Section title="Bio">
            <Text style={styles.bioText}>{profile.bio}</Text>
          </Section>
        )}

        {profile.skills.length > 0 && (
          <Section title="Skills">
            <View style={styles.pillRow}>
              {profile.skills.map((s) => (
                <View key={s} style={styles.skillPill}>
                  <Text style={styles.skillPillText}>{s}</Text>
                </View>
              ))}
            </View>
          </Section>
        )}

        {profile.interests.length > 0 && (
          <Section title="Interests">
            <View style={styles.pillRow}>
              {profile.interests.map((s) => (
                <View key={s} style={styles.interestPill}>
                  <Text style={styles.interestText}>{s}</Text>
                </View>
              ))}
            </View>
          </Section>
        )}

        {/* My Ideas / Post Idea */}
        <TouchableOpacity
          style={styles.postIdeaBtn}
          onPress={() => router.push(ideasCount > 0 ? '/my-ideas' : '/create-idea' as any)}
          activeOpacity={0.85}
        >
          <Text style={styles.postIdeaIcon}>🚀</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.postIdeaTitle}>
              {ideasCount > 0 ? `My Ideas (${ideasCount})` : 'Post a Startup Idea'}
            </Text>
            <Text style={styles.postIdeaSub}>
              {ideasCount > 0 ? 'Manage your posted ideas' : 'Let founders find and join your vision'}
            </Text>
          </View>
          <Text style={styles.postIdeaArrow}>›</Text>
        </TouchableOpacity>

        {!profile.bio && profile.skills.length === 0 && (
          <TouchableOpacity
            style={styles.emptyPrompt}
            onPress={() => router.push('/edit-profile')}
            activeOpacity={0.8}
          >
            <Text style={styles.emptyPromptText}>
              Your profile looks a bit empty.{'\n'}Tap to fill it in ✏️
            </Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  navbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  logo: { fontWeight: '800', fontSize: 22, color: Colors.text },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  content: { flex: 1 },
  hero: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingHorizontal: 20, paddingBottom: 24,
  },
  profilePic: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  name: { fontWeight: '800', fontSize: 22, color: Colors.text },
  role: { color: Colors.accent, fontSize: 13, fontWeight: '500', marginTop: 2 },
  loc: { color: Colors.muted, fontSize: 13, marginTop: 2 },
  bioText: { fontSize: 14, lineHeight: 23, color: 'rgba(240,240,245,0.75)' },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillPill: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: 'rgba(108,99,255,0.14)',
    borderWidth: 1, borderColor: 'rgba(108,99,255,0.3)',
  },
  skillPillText: { fontSize: 13, fontWeight: '500', color: Colors.accent },
  interestPill: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: Colors.surface2,
    borderWidth: 1, borderColor: Colors.border,
  },
  interestText: { fontSize: 13, color: Colors.muted },
  postIdeaBtn: {
    marginHorizontal: 20, marginBottom: 20,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.surface, borderRadius: 20,
    padding: 18, borderWidth: 1, borderColor: Colors.border,
  },
  postIdeaIcon: { fontSize: 28 },
  postIdeaTitle: { fontWeight: '700', fontSize: 15, color: Colors.text, marginBottom: 2 },
  postIdeaSub: { fontSize: 12, color: Colors.muted },
  postIdeaArrow: { fontSize: 22, color: Colors.muted },
  emptyPrompt: {
    marginHorizontal: 20, padding: 24, borderRadius: 20,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center',
  },
  emptyPromptText: { color: Colors.muted, fontSize: 14, textAlign: 'center', lineHeight: 22 },
});
