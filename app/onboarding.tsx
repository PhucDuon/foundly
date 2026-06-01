import React, { useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';
import { useAuth, ROLE_EMOJI } from '../context/AuthContext';

const ROLES = ['Developer', 'Designer', 'Product Manager', 'Marketer', 'Business Analyst', 'Other'];
const EXPERIENCE_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const ALL_SKILLS = [
  'React', 'React Native', 'Flutter', 'Swift', 'Kotlin', 'Node.js',
  'Python', 'Java', 'TypeScript', 'Go', 'PostgreSQL', 'MongoDB',
  'Firebase', 'AWS', 'Docker', 'UI/UX Design', 'Figma',
  'AI/ML', 'Marketing', 'SEO', 'Sales', 'Finance', 'Product Strategy',
];
const ALL_INTERESTS = [
  '🤖 AI', '💰 FinTech', '🏥 HealthTech', '🎓 EdTech',
  '☁️ SaaS', '🎮 Gaming', '🛒 E-commerce', '📱 Social Media',
  '🌱 GreenTech', '🔐 Cybersecurity', '🏠 PropTech', '🚗 Mobility',
];

const TOTAL = 3;
const TITLES = ["What's your role?", 'Your skills', 'Your interests'];
const SUBS = [
  'Help us find the best co-founder matches for you.',
  'Select all that apply.',
  'What kind of startups excite you?',
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { updateProfile, profile } = useAuth();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('');
  const [experience, setExperience] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggle = (list: string[], item: string, set: (v: string[]) => void) =>
    set(list.includes(item) ? list.filter(x => x !== item) : [...list, item]);

  const validate = () => {
    if (step === 1 && !role) return 'Please select your role.';
    if (step === 1 && !experience) return 'Please select your experience level.';
    if (step === 2 && skills.length === 0) return 'Select at least one skill.';
    if (step === 3 && interests.length === 0) return 'Select at least one interest.';
    return null;
  };

  const handleNext = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    if (step < TOTAL) { setStep(s => s + 1); return; }

    setLoading(true);
    try {
      await updateProfile({ role, experienceLevel: experience, skills, interests });
      router.replace('/' as any);
    } catch {
      setError('Failed to save. Please try again.');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.progressBarWrap}>
          <View style={[styles.progressFill, { width: `${(step / TOTAL) * 100}%` }]} />
        </View>
        <Text style={styles.stepCount}>{step}/{TOTAL}</Text>
      </View>

      {/* Welcome */}
      {profile?.name && (
        <Text style={styles.welcome}>Welcome, {profile.name.split(' ')[0]} 👋</Text>
      )}

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{TITLES[step - 1]}</Text>
        <Text style={styles.sub}>{SUBS[step - 1]}</Text>
        {!!error && <Text style={styles.error}>{error}</Text>}

        {/* Step 1: Role + Experience */}
        {step === 1 && (
          <View style={{ gap: 20 }}>
            <View style={styles.roleGrid}>
              {ROLES.map(r => (
                <TouchableOpacity key={r} style={[styles.roleItem, role === r && styles.roleActive]} onPress={() => setRole(r)} activeOpacity={0.7}>
                  <Text style={styles.roleEmoji}>{ROLE_EMOJI[r] ?? '🚀'}</Text>
                  <Text style={[styles.roleLabel, role === r && styles.roleLabelActive]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.sectionLabel}>Experience Level</Text>
            <View style={styles.expRow}>
              {EXPERIENCE_LEVELS.map(lvl => (
                <TouchableOpacity key={lvl} style={[styles.expPill, experience === lvl && styles.expPillActive]} onPress={() => setExperience(lvl)} activeOpacity={0.7}>
                  <Text style={[styles.expText, experience === lvl && styles.expTextActive]}>{lvl}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Step 2: Skills */}
        {step === 2 && (
          <View style={styles.chipsWrap}>
            {ALL_SKILLS.map(s => (
              <TouchableOpacity key={s} style={[styles.chip, skills.includes(s) && styles.chipActive]} onPress={() => toggle(skills, s, setSkills)} activeOpacity={0.7}>
                <Text style={[styles.chipText, skills.includes(s) && styles.chipTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Step 3: Interests */}
        {step === 3 && (
          <View style={styles.chipsWrap}>
            {ALL_INTERESTS.map(i => (
              <TouchableOpacity key={i} style={[styles.chip, interests.includes(i) && styles.chipActive]} onPress={() => toggle(interests, i, setInterests)} activeOpacity={0.7}>
                <Text style={[styles.chipText, interests.includes(i) && styles.chipTextActive]}>{i}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={handleNext} disabled={loading} activeOpacity={0.85}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>{step === TOTAL ? 'Get Started 🚀' : 'Continue →'}</Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14 },
  progressBarWrap: { flex: 1, height: 5, borderRadius: 3, backgroundColor: Colors.surface2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.accent, borderRadius: 3 },
  stepCount: { fontSize: 12, color: Colors.muted, fontWeight: '600' },
  welcome: { fontWeight: '700', fontSize: 16, color: Colors.muted, paddingHorizontal: 24, marginBottom: 4 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 4 },
  title: { fontWeight: '800', fontSize: 26, color: Colors.text, marginBottom: 6 },
  sub: { fontSize: 14, color: Colors.muted, marginBottom: 24 },
  error: { fontSize: 13, color: Colors.accent2, marginBottom: 12 },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  roleItem: { width: '30%', aspectRatio: 1, backgroundColor: Colors.surface, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: Colors.border, gap: 6 },
  roleActive: { borderColor: Colors.accent, backgroundColor: 'rgba(108,99,255,0.12)' },
  roleEmoji: { fontSize: 28 },
  roleLabel: { fontSize: 11, fontWeight: '600', color: Colors.muted, textAlign: 'center' },
  roleLabelActive: { color: Colors.accent },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: Colors.muted, textTransform: 'uppercase', letterSpacing: 0.8 },
  expRow: { flexDirection: 'row', gap: 10 },
  expPill: { flex: 1, paddingVertical: 12, borderRadius: 14, backgroundColor: Colors.surface, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border },
  expPillActive: { borderColor: Colors.accent, backgroundColor: 'rgba(108,99,255,0.12)' },
  expText: { fontSize: 13, fontWeight: '600', color: Colors.muted },
  expTextActive: { color: Colors.accent },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border },
  chipActive: { borderColor: Colors.accent, backgroundColor: 'rgba(108,99,255,0.14)' },
  chipText: { fontSize: 13, fontWeight: '500', color: Colors.muted },
  chipTextActive: { color: Colors.accent },
  footer: { paddingHorizontal: 24, paddingVertical: 16, borderTopWidth: 1, borderTopColor: Colors.border },
  btn: { backgroundColor: Colors.accent, borderRadius: 18, paddingVertical: 17, alignItems: 'center', shadowColor: Colors.accent, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
