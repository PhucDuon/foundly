import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { useAuth, ROLE_EMOJI, RegisterData } from '../../context/AuthContext';

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

const TOTAL_STEPS = 4;
const STEP_TITLES = ['Create your account', "What's your role?", 'Your skills', 'Your interests'];
const STEP_SUBS = [
  'Join thousands of founders building together.',
  'This helps us find you the best matches.',
  'Select all that apply.',
  'What kind of startups excite you?',
];

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoggedIn, isLoading } = useAuth();

  if (isLoading) return null;
  if (isLoggedIn) return <Redirect href={'/' as any} />;
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [experience, setExperience] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);

  const toggleSkill = (s: string) =>
    setSkills((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  const toggleInterest = (i: string) =>
    setInterests((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));

  const validate = (): string | null => {
    if (step === 1) {
      if (!name.trim()) return 'Please enter your name.';
      if (!email.trim() || !email.includes('@')) return 'Please enter a valid email.';
      if (password.length < 6) return 'Password must be at least 6 characters.';
    }
    if (step === 2) {
      if (!role) return 'Please select your role.';
      if (!experience) return 'Please select your experience level.';
    }
    if (step === 3 && skills.length === 0) return 'Select at least one skill.';
    if (step === 4 && interests.length === 0) return 'Select at least one interest.';
    return null;
  };

  const handleNext = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    if (step < TOTAL_STEPS) { setStep((s) => s + 1); return; }

    setLoading(true);
    try {
      const data: RegisterData = { name: name.trim(), email: email.trim(), password, role, experienceLevel: experience, skills, interests };
      await register(data);
    } catch (e) {
      setError((e as Error).message || 'Registration failed. Please try again.');
      setLoading(false);
    }
  };

  const handleBack = () => {
    setError('');
    if (step > 1) setStep((s) => s - 1);
    else router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <View style={styles.progressBarWrap}>
          <View style={[styles.progressFill, { width: `${(step / TOTAL_STEPS) * 100}%` }]} />
        </View>
        <Text style={styles.stepCount}>{step}/{TOTAL_STEPS}</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>{STEP_TITLES[step - 1]}</Text>
        <Text style={styles.stepSub}>{STEP_SUBS[step - 1]}</Text>
        {!!error && <Text style={styles.error}>{error}</Text>}

        {/* Step 1: Basic info */}
        {step === 1 && (
          <View style={styles.fields}>
            <TextInput style={styles.input} placeholder="Full name" placeholderTextColor={Colors.muted} value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Email address" placeholderTextColor={Colors.muted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
            <TextInput style={styles.input} placeholder="Password (min 6 chars)" placeholderTextColor={Colors.muted} value={password} onChangeText={setPassword} secureTextEntry />
          </View>
        )}

        {/* Step 2: Role + experience */}
        {step === 2 && (
          <View style={styles.fields}>
            <View style={styles.roleGrid}>
              {ROLES.map((r) => (
                <TouchableOpacity key={r} style={[styles.roleItem, role === r && styles.roleItemActive]} onPress={() => setRole(r)} activeOpacity={0.7}>
                  <Text style={styles.roleEmoji}>{ROLE_EMOJI[r] ?? '🚀'}</Text>
                  <Text style={[styles.roleLabel, role === r && styles.roleLabelActive]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.sectionLabel}>Experience Level</Text>
            <View style={styles.expRow}>
              {EXPERIENCE_LEVELS.map((lvl) => (
                <TouchableOpacity key={lvl} style={[styles.expPill, experience === lvl && styles.expPillActive]} onPress={() => setExperience(lvl)} activeOpacity={0.7}>
                  <Text style={[styles.expPillText, experience === lvl && styles.expPillTextActive]}>{lvl}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Step 3: Skills */}
        {step === 3 && (
          <View style={styles.chipsWrap}>
            {ALL_SKILLS.map((s) => (
              <TouchableOpacity key={s} style={[styles.chip, skills.includes(s) && styles.chipActive]} onPress={() => toggleSkill(s)} activeOpacity={0.7}>
                <Text style={[styles.chipText, skills.includes(s) && styles.chipTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Step 4: Interests */}
        {step === 4 && (
          <View style={styles.chipsWrap}>
            {ALL_INTERESTS.map((i) => (
              <TouchableOpacity key={i} style={[styles.chip, interests.includes(i) && styles.chipActive]} onPress={() => toggleInterest(i)} activeOpacity={0.7}>
                <Text style={[styles.chipText, interests.includes(i) && styles.chipTextActive]}>{i}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* CTA */}
      <View style={styles.footer}>
        <TouchableOpacity style={[styles.btnNext, loading && { opacity: 0.6 }]} onPress={handleNext} disabled={loading} activeOpacity={0.85}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnNextText}>{step === TOTAL_STEPS ? 'Create Account 🚀' : 'Continue →'}</Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { fontSize: 26, color: Colors.text, lineHeight: 32, marginTop: -2 },
  progressBarWrap: {
    flex: 1, height: 5, borderRadius: 3,
    backgroundColor: Colors.surface2, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: Colors.accent, borderRadius: 3 },
  stepCount: { fontSize: 12, color: Colors.muted, fontWeight: '600', minWidth: 28 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 8 },
  stepTitle: { fontWeight: '800', fontSize: 26, color: Colors.text, marginBottom: 8 },
  stepSub: { fontSize: 14, color: Colors.muted, marginBottom: 28 },
  error: { fontSize: 13, color: Colors.accent2, marginBottom: 12 },
  fields: { gap: 14 },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 16, paddingHorizontal: 18, paddingVertical: 15,
    fontSize: 15, color: Colors.text,
    borderWidth: 1, borderColor: Colors.border,
  },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 8 },
  roleItem: {
    width: '30%', aspectRatio: 1,
    backgroundColor: Colors.surface, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.border, gap: 6,
  },
  roleItemActive: { borderColor: Colors.accent, backgroundColor: 'rgba(108,99,255,0.12)' },
  roleEmoji: { fontSize: 28 },
  roleLabel: { fontSize: 11, fontWeight: '600', color: Colors.muted, textAlign: 'center' },
  roleLabelActive: { color: Colors.accent },
  sectionLabel: {
    fontSize: 13, fontWeight: '700', color: Colors.muted,
    textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 20, marginBottom: 12,
  },
  expRow: { flexDirection: 'row', gap: 10 },
  expPill: {
    flex: 1, paddingVertical: 12, borderRadius: 14,
    backgroundColor: Colors.surface,
    alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border,
  },
  expPillActive: { borderColor: Colors.accent, backgroundColor: 'rgba(108,99,255,0.12)' },
  expPillText: { fontSize: 13, fontWeight: '600', color: Colors.muted },
  expPillTextActive: { color: Colors.accent },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24,
    backgroundColor: Colors.surface,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  chipActive: { borderColor: Colors.accent, backgroundColor: 'rgba(108,99,255,0.14)' },
  chipText: { fontSize: 13, fontWeight: '500', color: Colors.muted },
  chipTextActive: { color: Colors.accent },
  footer: {
    paddingHorizontal: 24, paddingVertical: 16,
    borderTopWidth: 1, borderTopColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  btnNext: {
    backgroundColor: Colors.accent, borderRadius: 18, paddingVertical: 17,
    alignItems: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  btnNextText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
