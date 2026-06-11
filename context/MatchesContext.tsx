import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

// Used by chat screen for local message state
export type Message = {
  id: string;
  text: string;
  fromMe: boolean;
  sentAt: number;
  readAt?: number | null;
};

export type MatchEntry = {
  matchId: string;
  userId: string;
  name: string;
  emoji: string;
  role: string;
  bio: string;
  avatarUrl?: string | null;
  lastMessageAt?: string | null;
  hasUnread?: boolean;
};

type MatchesContextValue = {
  matches: MatchEntry[];
  fetchMatches: () => Promise<void>;
  addMatch: (entry: MatchEntry) => void;
  removeMatch: (matchId: string) => void;
  likesCount: number;
  fetchLikesCount: () => Promise<void>;
};

const MatchesContext = createContext<MatchesContextValue>({
  matches: [],
  fetchMatches: async () => {},
  addMatch: () => {},
  removeMatch: () => {},
  likesCount: 0,
  fetchLikesCount: async () => {},
});

export function MatchesProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const [matches, setMatches] = useState<MatchEntry[]>([]);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    if (!profile) {
      setMatches([]);
      setLikesCount(0);
    }
  }, [profile]);

  const fetchMatches = useCallback(async () => {
    if (!profile) return;
    try {
      const data = await api.get<any[]>('/matches');
      const seen = new Set<string>();
      const entries: MatchEntry[] = [];

      for (const m of data) {
        const other = m.user1_id === profile.id ? m.user2 : m.user1;
        if (!other?.id || seen.has(other.id)) continue; // skip duplicates
        seen.add(other.id);
        entries.push({
          matchId: m.id,
          userId: other.id,
          name: other.name,
          emoji: other.emoji ?? '🚀',
          role: other.role ?? '',
          bio: other.bio ?? '',
          avatarUrl: other.avatar_url ?? null,
          lastMessageAt: m.last_message_at ?? null,
          hasUnread: m.has_unread ?? false,
        });
      }

      setMatches(entries);
    } catch (e) {
      console.error('fetchMatches:', e);
    }
  }, [profile]);

  const addMatch = useCallback((entry: MatchEntry) => {
    setMatches(prev =>
      prev.some(m => m.matchId === entry.matchId) ? prev : [entry, ...prev]
    );
  }, []);

  const removeMatch = useCallback((matchId: string) => {
    setMatches(prev => prev.filter(m => m.matchId !== matchId));
  }, []);

  const fetchLikesCount = useCallback(async () => {
    if (!profile) return;
    try {
      const data = await api.get<any[]>('/matches/likes');
      setLikesCount(data.length);
    } catch {}
  }, [profile]);

  return (
    <MatchesContext.Provider value={{ matches, fetchMatches, addMatch, removeMatch, likesCount, fetchLikesCount }}>
      {children}
    </MatchesContext.Provider>
  );
}

export const useMatches = () => useContext(MatchesContext);
