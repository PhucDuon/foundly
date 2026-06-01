import React, { createContext, useCallback, useContext, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

// Used by chat screen for local message state
export type Message = {
  id: string;
  text: string;
  fromMe: boolean;
  sentAt: number;
};

export type MatchEntry = {
  matchId: string;
  userId: string;
  name: string;
  emoji: string;
  role: string;
  bio: string;
  avatarUrl?: string | null;
};

type MatchesContextValue = {
  matches: MatchEntry[];
  fetchMatches: () => Promise<void>;
  addMatch: (entry: MatchEntry) => void;
  removeMatch: (matchId: string) => void;
};

const MatchesContext = createContext<MatchesContextValue>({
  matches: [],
  fetchMatches: async () => {},
  addMatch: () => {},
  removeMatch: () => {},
});

export function MatchesProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const [matches, setMatches] = useState<MatchEntry[]>([]);

  const fetchMatches = useCallback(async () => {
    if (!profile) return;
    try {
      const data = await api.get<any[]>('/matches');
      setMatches(
        data.map(m => {
          const other = m.user1_id === profile.id ? m.user2 : m.user1;
          return {
            matchId: m.id,
            userId: other.id,
            name: other.name,
            emoji: other.emoji ?? '🚀',
            role: other.role ?? '',
            bio: other.bio ?? '',
            avatarUrl: other.avatar_url ?? null,
          };
        })
      );
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

  return (
    <MatchesContext.Provider value={{ matches, fetchMatches, addMatch, removeMatch }}>
      {children}
    </MatchesContext.Provider>
  );
}

export const useMatches = () => useContext(MatchesContext);
