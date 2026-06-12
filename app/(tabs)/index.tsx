import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { CardData } from '../../data/cards';
import { SwipeCard, SwipeCardHandle } from '../../components/SwipeCard';
import { MatchModal } from '../../components/MatchModal';
import { ProfileDetailModal } from '../../components/ProfileDetailModal';
import { FilterModal, FilterState, EMPTY_FILTERS } from '../../components/FilterModal';
import { SwipeLimitModal } from '../../components/SwipeLimitModal';
import { useMatches } from '../../context/MatchesContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export default function DiscoverScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { addMatch } = useMatches();

  const [mode, setMode] = useState<'founders' | 'ideas'>('founders');
  const [deck, setDeck] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(false);
  const [matchedCard, setMatchedCard] = useState<CardData | null>(null);
  const [pendingMatchId, setPendingMatchId] = useState<string | null>(null);
  const [detailCard, setDetailCard] = useState<CardData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [ideasCategory, setIdeasCategory] = useState('');
  const [ideasSort, setIdeasSort] = useState<'newest' | 'popular'>('newest');
  const [swipesToday, setSwipesToday] = useState(0);
  const swipesTodayRef = useRef(0);
  // Keep ref in sync so limit check is always current even mid-gesture
  useEffect(() => { swipesTodayRef.current = swipesToday; }, [swipesToday]);
  const topCardRef = useRef<SwipeCardHandle>(null);
  const pendingSuperLike = useRef(false);

  const activeFilterCount = filters.roles.length + filters.skills.length;

  const filteredDeck = useMemo(() => {
    return deck.filter(card => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const hit = card.name.toLowerCase().includes(q)
          || card.role.toLowerCase().includes(q)
          || card.bio.toLowerCase().includes(q)
          || card.skills.some(s => s.toLowerCase().includes(q));
        if (!hit) return false;
      }
      if (filters.roles.length > 0 && !filters.roles.includes(card.role)) return false;
      if (filters.skills.length > 0 && !filters.skills.some(s => card.skills.includes(s))) return false;
      return true;
    });
  }, [deck, searchQuery, filters]);

  const loadFounders = useCallback(async () => {
    setLoading(true);
    try {
      const users = await api.get<any[]>('/users/discover');
      setDeck(
        users.map(u => ({
          id: u.id,
          name: u.name,
          emoji: u.emoji ?? '🚀',
          role: u.role ?? '',
          bio: u.bio ?? '',
          skills: u.skills ?? [],
          match: false,
          compatibilityScore: u.compatibility_score,
          avatarUrl: u.avatar_url ?? null,
          linkedinVerified: u.linkedin_verified ?? false,
        }))
      );
    } catch {
      setDeck([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadIdeas = useCallback(async (category = ideasCategory, sort = ideasSort) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort });
      if (category) params.set('category', category);
      const ideas = await api.get<any[]>(`/ideas?${params}`);
      setDeck(
        ideas.map((i: any) => ({
          id: i.id,
          name: i.name,
          emoji: i.category?.split(' ')[0] ?? '💡',   // use category emoji as card bg
          role: `${i.category} · ${i.stage}`,
          bio: `${i.description}\n\nBy ${i.founder?.name ?? 'Unknown'}`,
          skills: i.looking_for ?? [],
          match: false,
          avatarUrl: null,                             // don't use founder photo as full-bleed bg
          interestCount: i.interest_count ?? 0,
        }))
      );
    } catch {
      setDeck([]);
    } finally {
      setLoading(false);
    }
  }, [ideasCategory, ideasSort]);

  // Fetch today's swipe count on mount
  useEffect(() => {
    if (profile) {
      api.get<{ count: number }>('/users/swipes-today')
        .then(d => setSwipesToday(d.count))
        .catch(() => {});
    }
  }, [profile]);

  // Initial load when mode/profile changes
  useEffect(() => {
    if (mode === 'founders' && profile) loadFounders();
    else if (mode === 'ideas' && profile) loadIdeas();
  }, [mode, profile]);

  // Reload deck when tab comes back into focus (e.g. returning from Likes screen)
  useFocusEffect(
    useCallback(() => {
      if (!profile) return;
      if (mode === 'founders') loadFounders();
      else loadIdeas();
    }, [mode, profile, loadFounders, loadIdeas])
  );

  const switchMode = (m: 'founders' | 'ideas') => setMode(m);

  const handleSwipeLeft = useCallback(async (card: CardData) => {
    setDeck(prev => prev.filter(c => c.id !== card.id));
    if (mode === 'founders') {
      swipesTodayRef.current += 1; // immediate ref update blocks next swipe synchronously
      setSwipesToday(swipesTodayRef.current);
      try {
        const res = await api.post<any>('/matches/swipe', { swiped_id: card.id, direction: 'left' });
        if (res.limit_reached) { setSwipesToday(res.swipes_today ?? 10); setShowLimitModal(true); return; }
        if (res.swipes_today !== undefined) setSwipesToday(res.swipes_today);
      } catch {
        setSwipesToday(prev => Math.max(0, prev - 1)); // revert on error
      }
    }
  }, [mode]);

  const handleSwipeRight = useCallback(async (card: CardData) => {
    pendingSuperLike.current = false;
    setDeck(prev => prev.filter(c => c.id !== card.id));

    if (mode === 'founders') {
      swipesTodayRef.current += 1;
      setSwipesToday(swipesTodayRef.current);
      try {
        const res = await api.post<any>('/matches/swipe', { swiped_id: card.id, direction: 'right' });
        if (res.limit_reached) {
          setSwipesToday(res.swipes_today ?? 10);
          setShowLimitModal(true);
          return;
        }
        if (res.swipes_today !== undefined) setSwipesToday(res.swipes_today);
        if (res.matched && res.match) {
          addMatch({ matchId: res.match.id, userId: card.id, name: card.name, emoji: card.emoji, role: card.role, bio: card.bio });
          setPendingMatchId(res.match.id);
          setMatchedCard(card);
        }
      } catch {}
    } else {
      // Ideas mode — express interest, match with the founder directly
      try {
        const res = await api.post<any>(`/ideas/${card.id}/interest`, {});
        if (res.matched && res.match) {
          addMatch({
            matchId: res.match.id,
            userId: res.founder.id,
            name: res.founder.name,
            emoji: res.founder.emoji,
            role: card.name, // idea name shown as context in chat
            bio: card.bio,
          });
          setPendingMatchId(res.match.id);
          setMatchedCard(card);
        }
      } catch {}
    }
  }, [mode, addMatch]);

  const isSwipeLimited = mode === 'founders' && swipesTodayRef.current >= 10;

  const handleButtonSwipe = (dir: 'left' | 'right') => {
    if (deck.length === 0) return;
    if (isSwipeLimited) { setShowLimitModal(true); return; }
    topCardRef.current?.swipe(dir);
  };

  const handleSuperLike = () => {
    if (deck.length === 0) return;
    if (isSwipeLimited) { setShowLimitModal(true); return; }
    pendingSuperLike.current = true;
    topCardRef.current?.swipe('right');
  };

  const visibleCards = filteredDeck.slice(0, 3);

  return (
    <SafeAreaView style={styles.container}>
      {/* Navbar */}
      <View style={styles.navbar}>
        <View>
          <Text style={styles.logo}>
            Found<Text style={{ color: Colors.accent }}>ly</Text>
          </Text>
          {mode === 'founders' && (
            <Text style={styles.swipesLeft}>{Math.max(0, 10 - swipesToday)} swipes left today</Text>
          )}
        </View>
        <View style={styles.modeTabs}>
          {(['founders', 'ideas'] as const).map(m => (
            <TouchableOpacity
              key={m}
              style={[styles.modeTab, mode === m && styles.modeTabActive]}
              onPress={() => switchMode(m)}
            >
              <Text style={[styles.modeTabText, mode === m && styles.modeTabTextActive]}>
                {m === 'founders' ? 'Founders' : 'Ideas'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.navActions}>
          <TouchableOpacity
            style={[styles.navBtn, showSearch && styles.navBtnActive]}
            onPress={() => { setShowSearch(s => !s); setSearchQuery(''); }}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 16 }}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navBtn, activeFilterCount > 0 && styles.navBtnActive]}
            onPress={() => setShowFilter(true)}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 16 }}>⚙️</Text>
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Search bar */}
      {showSearch && (
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name, role, skill..."
            placeholderTextColor={Colors.muted}
            autoFocus
            clearButtonMode="while-editing"
          />
        </View>
      )}

      {/* Ideas filters — category pills + sort toggle */}
      {mode === 'ideas' && (
        <View style={styles.ideasFilterBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryPills}>
            {['', '🤖 AI', '💰 FinTech', '🏥 HealthTech', '🎓 EdTech', '☁️ SaaS', '🎮 Gaming', '🛒 E-commerce', '📱 Social Media', '🌱 GreenTech', '🔐 Cybersecurity'].map(cat => (
              <TouchableOpacity
                key={cat || 'all'}
                style={[styles.categoryPill, ideasCategory === cat && styles.categoryPillActive]}
                onPress={() => { setIdeasCategory(cat); loadIdeas(cat, ideasSort); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.categoryPillText, ideasCategory === cat && styles.categoryPillTextActive]}>
                  {cat || 'All'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.sortRow}>
            {(['newest', 'popular'] as const).map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.sortBtn, ideasSort === s && styles.sortBtnActive]}
                onPress={() => { setIdeasSort(s); loadIdeas(ideasCategory, s); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.sortBtnText, ideasSort === s && styles.sortBtnTextActive]}>
                  {s === 'newest' ? '🕐 Newest' : '🔥 Popular'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={styles.swipeArea}>
        {loading ? (
          <ActivityIndicator size="large" color={Colors.accent} />
        ) : visibleCards.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🎉</Text>
            <Text style={styles.emptyTitle}>You've seen everyone!</Text>
            <Text style={styles.emptySub}>
              Check back soon for new founders and ideas near you.
            </Text>
          </View>
        ) : (
          [...visibleCards].reverse().map((card, reversedIdx) => {
            const stackIndex = visibleCards.length - 1 - reversedIdx;
            const isTop = stackIndex === 0;
            return (
              <SwipeCard
                ref={isTop ? topCardRef : undefined}
                key={card.id}
                card={card}
                isTop={isTop}
                stackIndex={stackIndex}
                onSwipeLeft={() => handleSwipeLeft(card)}
                onSwipeRight={() => handleSwipeRight(card)}
                onPress={isTop ? (isSwipeLimited ? () => setShowLimitModal(true) : () => setDetailCard(card)) : undefined}
                disabled={isSwipeLimited}
              />
            );
          })
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.btnAction, styles.btnSkip]} onPress={() => handleButtonSwipe('left')} activeOpacity={0.8}>
          <Text style={{ fontSize: 22, color: Colors.accent2 }}>✕</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btnAction, styles.btnLike]} onPress={() => handleButtonSwipe('right')} activeOpacity={0.8}>
          <Text style={{ fontSize: 28 }}>💜</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btnAction, styles.btnSuper]} onPress={handleSuperLike} activeOpacity={0.8}>
          <Text style={{ fontSize: 20, color: Colors.green }}>⚡</Text>
        </TouchableOpacity>
      </View>

      <MatchModal
        visible={!!matchedCard}
        card={matchedCard}
        onClose={goChat => {
          if (goChat && pendingMatchId) router.push(`/chat/${pendingMatchId}` as any);
          setMatchedCard(null);
          setPendingMatchId(null);
        }}
      />

      <ProfileDetailModal
        visible={!!detailCard}
        card={detailCard}
        onClose={() => setDetailCard(null)}
        onSkip={() => { if (detailCard) handleSwipeLeft(detailCard); setDetailCard(null); }}
        onConnect={() => { if (detailCard) handleSwipeRight(detailCard); setDetailCard(null); }}
      />

      <FilterModal
        visible={showFilter}
        filters={filters}
        onApply={setFilters}
        onClose={() => setShowFilter(false)}
      />

      <SwipeLimitModal
        visible={showLimitModal}
        swipesToday={swipesToday}
        onClose={() => setShowLimitModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  navbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  logo: { fontWeight: '800', fontSize: 22, color: Colors.text },
  swipesLeft: { fontSize: 11, color: Colors.muted, marginTop: 1 },
  modeTabs: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: 24, padding: 4, gap: 4 },
  modeTab: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  modeTabActive: { backgroundColor: Colors.accent },
  modeTabText: { fontSize: 12, fontWeight: '500', color: Colors.muted },
  modeTabTextActive: { color: '#fff' },
  navActions: { flexDirection: 'row', gap: 8 },
  navBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  navBtnActive: { borderColor: Colors.accent, backgroundColor: 'rgba(108,99,255,0.12)' },
  filterBadge: { position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: Colors.accent2, alignItems: 'center', justifyContent: 'center' },
  filterBadgeText: { fontSize: 9, color: '#fff', fontWeight: '800' },
  searchBar: { paddingHorizontal: 16, paddingBottom: 10 },
  searchInput: { backgroundColor: Colors.surface, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: Colors.text, borderWidth: 1, borderColor: Colors.border },
  swipeArea: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontWeight: '800', fontSize: 22, color: Colors.text, marginBottom: 8 },
  emptySub: { color: Colors.muted, fontSize: 14, textAlign: 'center', lineHeight: 22 },
  actions: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16, paddingVertical: 20, paddingBottom: 28 },
  btnAction: { borderRadius: 100, alignItems: 'center', justifyContent: 'center' },
  btnSkip: { width: 56, height: 56, backgroundColor: Colors.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  btnLike: { width: 72, height: 72, backgroundColor: Colors.accent, shadowColor: Colors.accent, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.45, shadowRadius: 15, elevation: 8 },
  btnSuper: { width: 56, height: 56, backgroundColor: Colors.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  ideasFilterBar: { paddingBottom: 6 },
  categoryPills: { paddingHorizontal: 16, gap: 8, paddingBottom: 8 },
  categoryPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  categoryPillActive: { backgroundColor: 'rgba(108,99,255,0.15)', borderColor: Colors.accent },
  categoryPillText: { fontSize: 12, color: Colors.muted, fontWeight: '500' },
  categoryPillTextActive: { color: Colors.accent, fontWeight: '700' },
  sortRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8 },
  sortBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  sortBtnActive: { backgroundColor: 'rgba(108,99,255,0.15)', borderColor: Colors.accent },
  sortBtnText: { fontSize: 12, color: Colors.muted, fontWeight: '500' },
  sortBtnTextActive: { color: Colors.accent, fontWeight: '700' },
});
