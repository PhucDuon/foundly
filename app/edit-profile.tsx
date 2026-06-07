import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../constants/Colors';
import { useAuth, ROLE_EMOJI } from '../context/AuthContext';
import { Avatar } from '../components/Avatar';
import { BASE_URL, getAuthToken } from '../services/api';

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

function SectionLabel({ children }: { children: string }) {
  return (
    <Text style={styles.sectionLabel}>{children}</Text>
  );
}

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile, updateProfile } = useAuth();

  const [name, setName] = useState(profile?.name ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [location, setLocation] = useState(profile?.location ?? '');
  const [role, setRole] = useState(profile?.role ?? '');
  const [experience, setExperience] = useState(profile?.experienceLevel ?? '');
  const [skills, setSkills] = useState<string[]>(profile?.skills ?? []);
  const [interests, setInterests] = useState<string[]>(profile?.interests ?? []);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatarUrl ?? null);
  const [uploading, setUploading] = useState(false);

  const toggleSkill = (s: string) =>
    setSkills((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  const toggleInterest = (i: string) =>
    setInterests((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));

  const pickAndUpload = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    setUploading(true);
    try {
      const uri = result.assets[0].uri;
      const formData = new FormData();
      formData.append('file', { uri, type: 'image/jpeg', name: 'avatar.jpg' } as any);
      const token = getAuthToken();
      const res = await fetch(`${BASE_URL}/users/me/avatar`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      setAvatarUrl(data.avatar_url);
      updateProfile({ avatarUrl: data.avatar_url });
    } catch (e) {
      Alert.alert('Upload failed', (e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    updateProfile({ name: name.trim(), bio: bio.trim(), location: location.trim(), role, experienceLevel: experience, skills, interests });
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveBtn} activeOpacity={0.8}>
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickAndUpload} activeOpacity={0.8} disabled={uploading}>
            <Avatar avatarUrl={avatarUrl} emoji={ROLE_EMOJI[role] ?? '🚀'} size={96} />
            <View style={styles.cameraOverlay}>
              {uploading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={{ fontSize: 16 }}>📷</Text>
              }
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Tap to change photo</Text>
        </View>

        <SectionLabel>Basic Info</SectionLabel>
        <TextInput style={styles.input} placeholder="Full name" placeholderTextColor={Colors.muted} value={name} onChangeText={setName} />
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          placeholder="Short bio — what are you building?"
          placeholderTextColor={Colors.muted}
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
        <TextInput style={styles.input} placeholder="Location (e.g. Sydney, AU)" placeholderTextColor={Colors.muted} value={location} onChangeText={setLocation} />

        <SectionLabel>Role</SectionLabel>
        <View style={styles.roleGrid}>
          {ROLES.map((r) => (
            <TouchableOpacity key={r} style={[styles.roleItem, role === r && styles.roleItemActive]} onPress={() => setRole(r)} activeOpacity={0.7}>
              <Text style={styles.roleEmoji}>{ROLE_EMOJI[r] ?? '🚀'}</Text>
              <Text style={[styles.roleLabel, role === r && styles.roleLabelActive]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <SectionLabel>Experience Level</SectionLabel>
        <View style={styles.expRow}>
          {EXPERIENCE_LEVELS.map((lvl) => (
            <TouchableOpacity key={lvl} style={[styles.expPill, experience === lvl && styles.expPillActive]} onPress={() => setExperience(lvl)} activeOpacity={0.7}>
              <Text style={[styles.expPillText, experience === lvl && styles.expPillTextActive]}>{lvl}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <SectionLabel>Skills</SectionLabel>
        <View style={styles.chipsWrap}>
          {ALL_SKILLS.map((s) => (
            <TouchableOpacity key={s} style={[styles.chip, skills.includes(s) && styles.chipActive]} onPress={() => toggleSkill(s)} activeOpacity={0.7}>
              <Text style={[styles.chipText, skills.includes(s) && styles.chipTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <SectionLabel>Interests</SectionLabel>
        <View style={styles.chipsWrap}>
          {ALL_INTERESTS.map((i) => (
            <TouchableOpacity key={i} style={[styles.chip, interests.includes(i) && styles.chipActive]} onPress={() => toggleInterest(i)} activeOpacity={0.7}>
              <Text style={[styles.chipText, interests.includes(i) && styles.chipTextActive]}>{i}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { fontSize: 26, color: Colors.text, lineHeight: 32, marginTop: -2 },
  headerTitle: { fontWeight: '700', fontSize: 17, color: Colors.text },
  saveBtn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16 },
  avatarSection: { alignItems: 'center', paddingVertical: 16, marginBottom: 8 },
  avatar: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  cameraOverlay: {
    position: 'absolute', bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.bg,
  },
  avatarHint: { fontSize: 12, color: Colors.muted, marginTop: 8 },
  sectionLabel: {
    fontSize: 12, fontWeight: '700', color: Colors.muted,
    textTransform: 'uppercase', letterSpacing: 1,
    marginBottom: 12, marginTop: 24,
  },
  input: {
    backgroundColor: Colors.surface, borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: Colors.text,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 12,
  },
  inputMultiline: { minHeight: 90, paddingTop: 14 },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 4 },
  roleItem: {
    width: '30%', aspectRatio: 1,
    backgroundColor: Colors.surface, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.border, gap: 6,
  },
  roleItemActive: { borderColor: Colors.accent, backgroundColor: 'rgba(108,99,255,0.12)' },
  roleEmoji: { fontSize: 26 },
  roleLabel: { fontSize: 10, fontWeight: '600', color: Colors.muted, textAlign: 'center' },
  roleLabelActive: { color: Colors.accent },
  expRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  expPill: {
    flex: 1, paddingVertical: 12, borderRadius: 14,
    backgroundColor: Colors.surface,
    alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border,
  },
  expPillActive: { borderColor: Colors.accent, backgroundColor: 'rgba(108,99,255,0.12)' },
  expPillText: { fontSize: 13, fontWeight: '600', color: Colors.muted },
  expPillTextActive: { color: Colors.accent },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 24,
    backgroundColor: Colors.surface,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  chipActive: { borderColor: Colors.accent, backgroundColor: 'rgba(108,99,255,0.14)' },
  chipText: { fontSize: 13, fontWeight: '500', color: Colors.muted },
  chipTextActive: { color: Colors.accent },
});
