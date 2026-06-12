import React, { useCallback, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { useAuth, UserProfile } from '../../context/AuthContext';
import { Avatar } from '../../components/Avatar';
import { api } from '../../services/api';

type CheckItem = { label: string; done: boolean; impact: string };

function getCompleteness(p: UserProfile): { pct: number; items: CheckItem[] } {
  const items: CheckItem[] = [
    { label: 'Profile photo',       done: !!p.avatarUrl,            impact: 'First impression' },
    { label: 'Bio',                 done: !!p.bio,                  impact: 'Lets others know your story' },
    { label: 'Location',            done: !!p.location,             impact: '+10 pts in compatibility' },
    { label: '3+ skills',           done: p.skills.length >= 3,     impact: 'Better skill-fit matching' },
    { label: 'Interests',           done: p.interests.length >= 2,  impact: 'Shared vision alignment' },
  ];
  const pct = Math.round((items.filter(i => i.done).length / items.length) * 100);
  return { pct, items };
}

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
  const { profile, verifyWithLinkedIn } = useAuth();
  const [ideasCount, setIdeasCount] = useState(0);
  const [verifying, setVerifying] = useState(false);

  const handleLinkedInVerify = async () => {
    setVerifying(true);
    try {
      await verifyWithLinkedIn();
      Alert.alert('Verified!', 'Your LinkedIn profile has been verified.');
    } catch (e: any) {
      Alert.alert('Verification failed', e.message ?? 'Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      api.get<any[]>('/ideas/mine').then(data => setIdeasCount(data.length)).catch(() => {});
    }, [])
  );

  if (!profile) return null;

  const { pct, items } = getCompleteness(profile);
  const incomplete = items.filter(i => !i.done);

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
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/settings' as any)} activeOpacity={0.7}>
            <Text style={{ fontSize: 18 }}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <Avatar avatarUrl={profile.avatarUrl} emoji={profile.emoji} size={80} />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.name}>{profile.name}</Text>
              {profile.linkedinVerified && (
                <View style={styles.linkedinBadge}>
                  <Text style={styles.linkedinBadgeText}>in ✓</Text>
                </View>
              )}
            </View>
            <Text style={styles.role}>
              {profile.role}{profile.experienceLevel ? ` · ${profile.experienceLevel}` : ''}
            </Text>
            {!!profile.location && <Text style={styles.loc}>📍 {profile.location}</Text>}
            {!profile.linkedinVerified && (
              <TouchableOpacity
                style={[styles.linkedinBtn, verifying && { opacity: 0.6 }]}
                onPress={handleLinkedInVerify}
                disabled={verifying}
                activeOpacity={0.8}
              >
                <Text style={styles.linkedinBtnText}>
                  {verifying ? 'Verifying…' : 'in  Verify with LinkedIn'}
                </Text>
              </TouchableOpacity>
            )}
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

        {/* Upgrade to Pro banner */}
        <TouchableOpacity
          style={styles.proBanner}
          onPress={() => router.push('/paywall' as any)}
          activeOpacity={0.85}
        >
          <View style={styles.proBannerLeft}>
            <Text style={styles.proBannerIcon}>👑</Text>
            <View>
              <Text style={styles.proBannerTitle}>Upgrade to Pro</Text>
              <Text style={styles.proBannerSub}>Unlimited swipes · See who liked you</Text>
            </View>
          </View>
          <Text style={styles.proBannerArrow}>›</Text>
        </TouchableOpacity>

        {/* Profile completeness card — hide when 100% */}
        {pct < 100 && (
          <View style={styles.completenessCard}>
            <View style={styles.completenessHeader}>
              <Text style={styles.completenessTitle}>Profile strength</Text>
              <Text style={[
                styles.completenessPct,
                { color: pct >= 80 ? Colors.green : pct >= 50 ? Colors.accent : Colors.accent2 },
              ]}>{pct}%</Text>
            </View>

            {/* Progress bar */}
            <View style={styles.progressTrack}>
              <View style={[
                styles.progressFill,
                {
                  width: `${pct}%` as any,
                  backgroundColor: pct >= 80 ? Colors.green : pct >= 50 ? Colors.accent : Colors.accent2,
                },
              ]} />
            </View>

            {/* Missing items */}
            <View style={styles.checkList}>
              {incomplete.map(item => (
                <TouchableOpacity
                  key={item.label}
                  style={styles.checkRow}
                  onPress={() => router.push('/edit-profile')}
                  activeOpacity={0.7}
                >
                  <View style={styles.checkCircle}>
                    <Text style={styles.checkCircleText}>+</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.checkLabel}>{item.label}</Text>
                    <Text style={styles.checkImpact}>{item.impact}</Text>
                  </View>
                  <Text style={styles.checkArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
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
  proBanner: {
    marginHorizontal: 20, marginBottom: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(108,99,255,0.12)',
    borderRadius: 20, padding: 18,
    borderWidth: 1, borderColor: 'rgba(108,99,255,0.35)',
  },
  proBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  proBannerIcon: { fontSize: 26 },
  proBannerTitle: { fontWeight: '700', fontSize: 15, color: Colors.accent, marginBottom: 2 },
  proBannerSub: { fontSize: 12, color: Colors.muted },
  proBannerArrow: { fontSize: 22, color: Colors.accent },
  completenessCard: {
    marginHorizontal: 20, marginBottom: 20,
    backgroundColor: Colors.surface, borderRadius: 20,
    padding: 18, borderWidth: 1, borderColor: Colors.border,
  },
  completenessHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  completenessTitle: { fontWeight: '700', fontSize: 14, color: Colors.text },
  completenessPct: { fontWeight: '800', fontSize: 16 },
  progressTrack: { height: 6, backgroundColor: Colors.surface2, borderRadius: 3, marginBottom: 16, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  checkList: { gap: 10 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkCircle: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 1.5, borderColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  checkCircleText: { color: Colors.accent, fontWeight: '700', fontSize: 16, lineHeight: 20 },
  checkLabel: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 1 },
  checkImpact: { fontSize: 11, color: Colors.muted },
  checkArrow: { fontSize: 20, color: Colors.muted },
  linkedinBadge: {
    backgroundColor: '#0A66C2', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  linkedinBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  linkedinBtn: {
    marginTop: 8, alignSelf: 'flex-start',
    backgroundColor: '#0A66C2', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  linkedinBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
