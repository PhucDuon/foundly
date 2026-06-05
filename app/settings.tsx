import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const APP_VERSION = '1.0.0';

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function Row({
  icon, label, value, onPress, danger, rightEl,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  rightEl?: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress && !rightEl}
    >
      <Text style={styles.rowIcon}>{icon}</Text>
      <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
      {rightEl ?? (
        value !== undefined
          ? <Text style={styles.rowValue}>{value}</Text>
          : onPress ? <Text style={styles.rowArrow}>›</Text> : null
      )}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { profile, logout, updateProfile } = useAuth();
  const [discoverable, setDiscoverable] = useState(profile?.isDiscoverable ?? true);
  const [savingDiscover, setSavingDiscover] = useState(false);

  const toggleDiscoverable = async (val: boolean) => {
    setDiscoverable(val);
    setSavingDiscover(true);
    try {
      await updateProfile({ isDiscoverable: val });
    } catch {
      setDiscoverable(!val); // revert on error
    } finally {
      setSavingDiscover(false);
    }
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your profile, matches, and messages. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you sure?',
              'Type DELETE to confirm — your account will be gone forever.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, delete everything',
                  style: 'destructive',
                  onPress: deleteAccount,
                },
              ]
            );
          },
        },
      ]
    );
  };

  const deleteAccount = async () => {
    try {
      await api.delete('/auth/me');
      await logout();
    } catch {
      Alert.alert('Error', 'Failed to delete account. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Privacy */}
        <SectionHeader title="Privacy" />
        <View style={styles.card}>
          <Row
            icon="🔍"
            label="Discoverable"
            rightEl={
              <Switch
                value={discoverable}
                onValueChange={toggleDiscoverable}
                disabled={savingDiscover}
                trackColor={{ false: Colors.surface2, true: Colors.accent }}
                thumbColor="#fff"
              />
            }
          />
          <View style={styles.rowHint}>
            <Text style={styles.hintText}>
              When off, your profile won't appear in other founders' Discover feed. You can still chat with existing matches.
            </Text>
          </View>
        </View>

        {/* Account */}
        <SectionHeader title="Account" />
        <View style={styles.card}>
          <Row icon="📧" label="Email" value={profile?.email ?? '—'} />
          <View style={styles.divider} />
          <Row icon="🚪" label="Log Out" onPress={async () => { await logout(); }} />
          <View style={styles.divider} />
          <Row icon="🗑️" label="Delete Account" onPress={confirmDeleteAccount} danger />
        </View>

        {/* About */}
        <SectionHeader title="About" />
        <View style={styles.card}>
          <Row icon="📱" label="App Version" value={APP_VERSION} />
          <View style={styles.divider} />
          <Row
            icon="⚖️"
            label="Terms of Service"
            onPress={() => Alert.alert('Terms of Service', 'Full terms will be available before App Store launch.')}
          />
          <View style={styles.divider} />
          <Row
            icon="🔒"
            label="Privacy Policy"
            onPress={() => Alert.alert('Privacy Policy', 'Full policy will be available before App Store launch.')}
          />
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
    backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { fontSize: 26, color: Colors.text, lineHeight: 32, marginTop: -2 },
  title: { fontWeight: '800', fontSize: 18, color: Colors.text },
  scroll: { padding: 20 },
  sectionHeader: {
    fontSize: 12, fontWeight: '700', textTransform: 'uppercase',
    letterSpacing: 1, color: Colors.muted, marginBottom: 10, marginTop: 8,
  },
  card: {
    backgroundColor: Colors.surface, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 24,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 15,
  },
  rowIcon: { fontSize: 18, width: 26, textAlign: 'center' },
  rowLabel: { flex: 1, fontSize: 15, color: Colors.text, fontWeight: '500' },
  rowLabelDanger: { color: Colors.accent2 },
  rowValue: { fontSize: 14, color: Colors.muted },
  rowArrow: { fontSize: 20, color: Colors.muted },
  rowHint: { paddingHorizontal: 16, paddingBottom: 14 },
  hintText: { fontSize: 12, color: Colors.muted, lineHeight: 18 },
  divider: { height: 1, backgroundColor: Colors.border, marginLeft: 54 },
});
