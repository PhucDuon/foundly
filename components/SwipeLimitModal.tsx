import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';

const DAILY_LIMIT = 10;

type Props = {
  visible: boolean;
  swipesToday: number;
  onClose: () => void;
};

function hoursUntilReset(): number {
  const now = new Date();
  const reset = new Date();
  reset.setUTCHours(24, 0, 0, 0);
  return Math.ceil((reset.getTime() - now.getTime()) / (1000 * 60 * 60));
}

export function SwipeLimitModal({ visible, swipesToday, onClose }: Props) {
  const router = useRouter();
  const hours = hoursUntilReset();

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.icon}>🔒</Text>
          <Text style={styles.title}>Daily Limit Reached</Text>
          <Text style={styles.sub}>
            You've used all {DAILY_LIMIT} free swipes today.{'\n'}
            Come back in <Text style={{ color: Colors.accent, fontWeight: '700' }}>{hours}h</Text> for more.
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{swipesToday}</Text>
              <Text style={styles.statLabel}>Swipes today</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>{DAILY_LIMIT}</Text>
              <Text style={styles.statLabel}>Daily limit</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>{hours}h</Text>
              <Text style={styles.statLabel}>Resets in</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.btnPremium}
            activeOpacity={0.85}
            onPress={() => { onClose(); router.push('/paywall' as any); }}
          >
            <Text style={styles.btnPremiumText}>⚡ Get Unlimited Swipes</Text>
            <Text style={styles.btnPremiumSub}>Upgrade to Pro — See plans</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnClose} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.btnCloseText}>Maybe later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10,10,15,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modal: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  icon: { fontSize: 52, marginBottom: 16 },
  title: { fontWeight: '800', fontSize: 24, color: Colors.text, marginBottom: 10, textAlign: 'center' },
  sub: { fontSize: 14, color: Colors.muted, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface2,
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    width: '100%',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stat: { alignItems: 'center', flex: 1 },
  statNum: { fontWeight: '800', fontSize: 22, color: Colors.text, marginBottom: 4 },
  statLabel: { fontSize: 11, color: Colors.muted },
  divider: { width: 1, backgroundColor: Colors.border },
  btnPremium: {
    width: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  btnPremiumText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  btnPremiumSub: { color: 'rgba(255,255,255,0.65)', fontSize: 11, marginTop: 3 },
  btnClose: {
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnCloseText: { color: Colors.muted, fontSize: 14 },
});
