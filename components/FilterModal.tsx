import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../constants/Colors';

export type FilterState = {
  roles: string[];
  skills: string[];
};

export const EMPTY_FILTERS: FilterState = { roles: [], skills: [] };

const ROLES = ['Developer', 'Designer', 'Product Manager', 'Marketer', 'Business Analyst', 'Other'];
const SKILLS = [
  'React', 'React Native', 'Flutter', 'Swift', 'Node.js', 'Python',
  'Java', 'TypeScript', 'Go', 'PostgreSQL', 'MongoDB', 'Firebase',
  'AWS', 'Docker', 'UI/UX Design', 'Figma', 'AI/ML', 'Marketing',
  'SEO', 'Sales', 'Finance', 'Product Strategy',
];

type Props = {
  visible: boolean;
  filters: FilterState;
  onApply: (f: FilterState) => void;
  onClose: () => void;
};

export function FilterModal({ visible, filters, onApply, onClose }: Props) {
  const [roles, setRoles] = useState<string[]>(filters.roles);
  const [skills, setSkills] = useState<string[]>(filters.skills);

  const toggle = (list: string[], item: string, set: (v: string[]) => void) =>
    set(list.includes(item) ? list.filter(x => x !== item) : [...list, item]);

  const activeCount = roles.length + skills.length;

  const handleApply = () => {
    onApply({ roles, skills });
    onClose();
  };

  const handleClear = () => {
    setRoles([]);
    setSkills([]);
    onApply(EMPTY_FILTERS);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Filters</Text>
            {activeCount > 0 && (
              <TouchableOpacity onPress={handleClear} activeOpacity={0.7}>
                <Text style={styles.clearBtn}>Clear all</Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {/* Role */}
            <Text style={styles.sectionLabel}>Role</Text>
            <View style={styles.chipsWrap}>
              {ROLES.map(r => (
                <TouchableOpacity
                  key={r}
                  style={[styles.chip, roles.includes(r) && styles.chipActive]}
                  onPress={() => toggle(roles, r, setRoles)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, roles.includes(r) && styles.chipTextActive]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Skills they have */}
            <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Has Skills</Text>
            <Text style={styles.sectionHint}>Show people who have at least one of these skills</Text>
            <View style={styles.chipsWrap}>
              {SKILLS.map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.chip, skills.includes(s) && styles.chipSkillActive]}
                  onPress={() => toggle(skills, s, setSkills)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, skills.includes(s) && styles.chipTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ height: 16 }} />
          </ScrollView>

          {/* Apply button */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.applyBtn} onPress={handleApply} activeOpacity={0.85}>
              <Text style={styles.applyText}>
                {activeCount > 0 ? `Apply ${activeCount} filter${activeCount > 1 ? 's' : ''}` : 'Apply'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32,
    maxHeight: '85%', borderWidth: 1, borderColor: Colors.border,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.muted, alignSelf: 'center', marginTop: 12, marginBottom: 4, opacity: 0.4 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16 },
  title: { fontWeight: '800', fontSize: 20, color: Colors.text },
  clearBtn: { fontSize: 14, color: Colors.accent2, fontWeight: '600' },
  content: { paddingHorizontal: 24 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: Colors.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  sectionHint: { fontSize: 12, color: Colors.muted, marginBottom: 12, marginTop: -8 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 24, backgroundColor: Colors.surface2, borderWidth: 1.5, borderColor: Colors.border },
  chipActive: { borderColor: Colors.accent, backgroundColor: 'rgba(108,99,255,0.14)' },
  chipSkillActive: { borderColor: Colors.green, backgroundColor: 'rgba(0,212,170,0.12)' },
  chipText: { fontSize: 13, fontWeight: '500', color: Colors.muted },
  chipTextActive: { color: Colors.text },
  footer: { paddingHorizontal: 24, paddingVertical: 16, borderTopWidth: 1, borderTopColor: Colors.border },
  applyBtn: {
    backgroundColor: Colors.accent, borderRadius: 18, paddingVertical: 16, alignItems: 'center',
    shadowColor: Colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 5,
  },
  applyText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
