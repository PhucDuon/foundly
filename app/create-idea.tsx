import React, { useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';
import { api } from '../services/api';

const CATEGORIES = ['🤖 AI', '💰 FinTech', '🏥 HealthTech', '🎓 EdTech', '☁️ SaaS', '🎮 Gaming', '🛒 E-commerce', '📱 Social Media', '🌱 GreenTech', '🔐 Cybersecurity'];
const STAGES = ['Idea', 'MVP', 'Early Stage', 'Growth'];
const ROLES = ['Developer', 'Designer', 'Product Manager', 'Marketer', 'Business Analyst'];

function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

export default function CreateIdeaScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [stage, setStage] = useState('Idea');
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleRole = (r: string) =>
    setLookingFor(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);

  const handlePost = async () => {
    if (!name.trim()) { setError('Please enter a startup name.'); return; }
    if (!description.trim()) { setError('Please enter an elevator pitch.'); return; }
    if (!category) { setError('Please select a category.'); return; }
    if (lookingFor.length === 0) { setError('Select at least one role you need.'); return; }

    setLoading(true);
    setError('');
    try {
      await api.post('/ideas', {
        name: name.trim(),
        description: description.trim(),
        category,
        stage,
        looking_for: lookingFor,
      });
      router.back();
    } catch (e) {
      setError((e as Error).message || 'Failed to post idea.');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post a Startup Idea</Text>
        <TouchableOpacity onPress={handlePost} style={[styles.postBtn, loading && { opacity: 0.6 }]} disabled={loading} activeOpacity={0.8}>
          {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.postBtnText}>Post</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!!error && <Text style={styles.error}>{error}</Text>}

        <SectionLabel>Startup Name</SectionLabel>
        <TextInput
          style={styles.input}
          placeholder="e.g. AI Study Buddy"
          placeholderTextColor={Colors.muted}
          value={name}
          onChangeText={setName}
        />

        <SectionLabel>Elevator Pitch</SectionLabel>
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          placeholder="What problem do you solve? Who is it for? What makes it different?"
          placeholderTextColor={Colors.muted}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <SectionLabel>Category</SectionLabel>
        <View style={styles.chipsWrap}>
          {CATEGORIES.map(c => (
            <TouchableOpacity
              key={c}
              style={[styles.chip, category === c && styles.chipActive]}
              onPress={() => setCategory(c)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <SectionLabel>Current Stage</SectionLabel>
        <View style={styles.stageRow}>
          {STAGES.map(s => (
            <TouchableOpacity
              key={s}
              style={[styles.stagePill, stage === s && styles.stagePillActive]}
              onPress={() => setStage(s)}
              activeOpacity={0.7}
            >
              <Text style={[styles.stagePillText, stage === s && styles.stagePillTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <SectionLabel>Looking For</SectionLabel>
        <View style={styles.chipsWrap}>
          {ROLES.map(r => (
            <TouchableOpacity
              key={r}
              style={[styles.chip, lookingFor.includes(r) && styles.chipRoleActive]}
              onPress={() => toggleRole(r)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, lookingFor.includes(r) && styles.chipRoleTextActive]}>{r}</Text>
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
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 26, color: Colors.text, lineHeight: 32, marginTop: -2 },
  headerTitle: { fontWeight: '700', fontSize: 17, color: Colors.text },
  postBtn: { backgroundColor: Colors.accent, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, minWidth: 56, alignItems: 'center' },
  postBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16 },
  error: { fontSize: 13, color: Colors.accent2, marginBottom: 12 },
  sectionLabel: {
    fontSize: 12, fontWeight: '700', color: Colors.muted,
    textTransform: 'uppercase', letterSpacing: 1,
    marginBottom: 12, marginTop: 24,
  },
  input: {
    backgroundColor: Colors.surface, borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: Colors.text,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 4,
  },
  inputMultiline: { minHeight: 110, paddingTop: 14 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 24,
    backgroundColor: Colors.surface,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  chipActive: { borderColor: Colors.accent, backgroundColor: 'rgba(108,99,255,0.14)' },
  chipRoleActive: { borderColor: Colors.accent2, backgroundColor: 'rgba(255,101,132,0.12)' },
  chipText: { fontSize: 13, fontWeight: '500', color: Colors.muted },
  chipTextActive: { color: Colors.accent },
  chipRoleTextActive: { color: Colors.accent2 },
  stageRow: { flexDirection: 'row', gap: 10 },
  stagePill: {
    flex: 1, paddingVertical: 11, borderRadius: 14,
    backgroundColor: Colors.surface,
    alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border,
  },
  stagePillActive: { borderColor: Colors.accent, backgroundColor: 'rgba(108,99,255,0.12)' },
  stagePillText: { fontSize: 12, fontWeight: '600', color: Colors.muted },
  stagePillTextActive: { color: Colors.accent },
});
