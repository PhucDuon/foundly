import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';

const PLANS = [
  {
    id: 'monthly',
    label: 'Monthly',
    price: '$9.99',
    period: '/ month',
    badge: null,
    pricePerMonth: 9.99,
  },
  {
    id: 'yearly',
    label: 'Yearly',
    price: '$59.99',
    period: '/ year',
    badge: 'SAVE 50%',
    pricePerMonth: 5.0,
  },
];

const FEATURES = [
  { icon: '⚡', title: 'Unlimited Swipes', free: '10 / day', pro: 'Unlimited' },
  { icon: '💜', title: 'See Who Liked You', free: 'Blurred', pro: 'Full access' },
  { icon: '🚀', title: 'Priority in Discover', free: 'Standard', pro: 'Boosted' },
  { icon: '⭐', title: 'Super Likes', free: '1 / day', pro: 'Unlimited' },
  { icon: '💡', title: 'Idea Boosts', free: '—', pro: '3 per week' },
  { icon: '✅', title: 'Verified Badge', free: '—', pro: 'Included' },
];

export default function PaywallScreen() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');

  const handleSubscribe = () => {
    // TODO: wire up RevenueCat purchase flow
    router.back();
  };

  const handleRestore = () => {
    // TODO: RevenueCat restorePurchases()
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Close button */}
      <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()} activeOpacity={0.7}>
        <Text style={styles.closeBtnText}>✕</Text>
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Hero */}
        <LinearGradient
          colors={['rgba(108,99,255,0.25)', 'rgba(108,99,255,0)']}
          style={styles.hero}
        >
          <Text style={styles.crown}>👑</Text>
          <Text style={styles.heroTitle}>
            Found<Text style={{ color: Colors.accent }}>ly</Text> Pro
          </Text>
          <Text style={styles.heroSub}>
            Find your co-founder faster.{'\n'}No limits, no waiting.
          </Text>
        </LinearGradient>

        {/* Feature comparison table */}
        <View style={styles.section}>
          <View style={styles.tableHeader}>
            <View style={{ flex: 1 }} />
            <Text style={styles.tableHeaderFree}>Free</Text>
            <Text style={styles.tableHeaderPro}>Pro</Text>
          </View>

          {FEATURES.map((f, i) => (
            <View key={f.title} style={[styles.tableRow, i % 2 === 0 && styles.tableRowAlt]}>
              <View style={styles.tableFeature}>
                <Text style={styles.featureIcon}>{f.icon}</Text>
                <Text style={styles.featureTitle}>{f.title}</Text>
              </View>
              <Text style={styles.freeVal}>{f.free}</Text>
              <Text style={styles.proVal}>{f.pro}</Text>
            </View>
          ))}
        </View>

        {/* Plan selector */}
        <View style={styles.plansRow}>
          {PLANS.map(plan => {
            const isSelected = selectedPlan === plan.id;
            return (
              <TouchableOpacity
                key={plan.id}
                style={[styles.planCard, isSelected && styles.planCardSelected]}
                onPress={() => setSelectedPlan(plan.id as any)}
                activeOpacity={0.8}
              >
                {plan.badge && (
                  <View style={styles.planBadge}>
                    <Text style={styles.planBadgeText}>{plan.badge}</Text>
                  </View>
                )}
                {isSelected && <View style={styles.planCheckDot} />}
                <Text style={[styles.planLabel, isSelected && styles.planLabelSelected]}>
                  {plan.label}
                </Text>
                <Text style={[styles.planPrice, isSelected && styles.planPriceSelected]}>
                  {plan.price}
                </Text>
                <Text style={styles.planPeriod}>{plan.period}</Text>
                {plan.id === 'yearly' && (
                  <Text style={styles.planNote}>
                    ~${plan.pricePerMonth.toFixed(2)}/mo
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* CTA */}
        <TouchableOpacity style={styles.ctaBtn} onPress={handleSubscribe} activeOpacity={0.85}>
          <LinearGradient
            colors={[Colors.accent, '#9b8fff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            <Text style={styles.ctaText}>Start 3-Day Free Trial</Text>
            <Text style={styles.ctaSub}>
              then {selectedPlan === 'yearly' ? '$59.99/year' : '$9.99/month'} · Cancel anytime
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Restore */}
        <TouchableOpacity onPress={handleRestore} activeOpacity={0.6} style={styles.restoreBtn}>
          <Text style={styles.restoreText}>Restore Purchase</Text>
        </TouchableOpacity>

        <Text style={styles.legalText}>
          Subscription auto-renews. Cancel anytime in App Store settings.
          By subscribing you agree to our Terms of Service and Privacy Policy.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  closeBtn: {
    position: 'absolute',
    top: 56,
    right: 20,
    zIndex: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  closeBtnText: { color: Colors.muted, fontSize: 14, fontWeight: '600' },
  scroll: { paddingBottom: 48 },

  // Hero
  hero: {
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  crown: { fontSize: 52, marginBottom: 12 },
  heroTitle: { fontWeight: '900', fontSize: 32, color: Colors.text, marginBottom: 10 },
  heroSub: { fontSize: 15, color: Colors.muted, textAlign: 'center', lineHeight: 24 },

  // Feature table
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: Colors.surface2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tableHeaderFree: { width: 72, textAlign: 'center', fontSize: 12, color: Colors.muted, fontWeight: '600' },
  tableHeaderPro: { width: 80, textAlign: 'center', fontSize: 12, color: Colors.accent, fontWeight: '700' },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  tableRowAlt: { backgroundColor: 'rgba(255,255,255,0.02)' },
  tableFeature: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureIcon: { fontSize: 16 },
  featureTitle: { fontSize: 13, color: Colors.text, fontWeight: '500' },
  freeVal: { width: 72, textAlign: 'center', fontSize: 12, color: Colors.muted },
  proVal: { width: 80, textAlign: 'center', fontSize: 12, color: Colors.green, fontWeight: '600' },

  // Plans
  plansRow: { flexDirection: 'row', marginHorizontal: 16, gap: 12, marginBottom: 24 },
  planCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    position: 'relative',
    overflow: 'hidden',
  },
  planCardSelected: {
    borderColor: Colors.accent,
    backgroundColor: 'rgba(108,99,255,0.1)',
  },
  planCheckDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.accent,
    position: 'absolute',
    top: 10,
    right: 10,
  },
  planBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.accent,
    paddingVertical: 3,
    alignItems: 'center',
  },
  planBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  planLabel: { marginTop: 16, fontSize: 12, color: Colors.muted, fontWeight: '600', marginBottom: 4 },
  planLabelSelected: { color: Colors.accent },
  planPrice: { fontSize: 26, fontWeight: '800', color: Colors.text, marginBottom: 2 },
  planPriceSelected: { color: Colors.accent },
  planPeriod: { fontSize: 11, color: Colors.muted },
  planNote: { fontSize: 10, color: Colors.green, marginTop: 4, fontWeight: '600' },

  // CTA
  ctaBtn: { marginHorizontal: 16, borderRadius: 20, overflow: 'hidden', marginBottom: 12 },
  ctaGradient: { paddingVertical: 18, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 17 },
  ctaSub: { color: 'rgba(255,255,255,0.65)', fontSize: 11, marginTop: 4 },

  // Footer
  restoreBtn: { alignItems: 'center', paddingVertical: 10 },
  restoreText: { color: Colors.muted, fontSize: 13 },
  legalText: {
    fontSize: 10,
    color: 'rgba(240,240,245,0.25)',
    textAlign: 'center',
    paddingHorizontal: 32,
    marginTop: 8,
    lineHeight: 16,
  },
});
