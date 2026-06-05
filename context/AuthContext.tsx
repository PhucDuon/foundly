import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { api, setAuthToken, setOnUnauthorized } from '../services/api';
import { supabase, setRealtimeSession } from '../services/supabase';

WebBrowser.maybeCompleteAuthSession();

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: string;
  experienceLevel: string;
  bio: string;
  location: string;
  skills: string[];
  interests: string[];
  emoji: string;
  avatarUrl: string | null;
  isDiscoverable: boolean;
};

export type RegisterData = {
  name: string;
  email: string;
  password: string;
  role: string;
  experienceLevel: string;
  skills: string[];
  interests: string[];
};

type AuthContextValue = {
  isLoggedIn: boolean;
  isLoading: boolean;
  profile: UserProfile | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
};

export const ROLE_EMOJI: Record<string, string> = {
  Developer: '🧑‍💻',
  Designer: '🎨',
  'Product Manager': '📋',
  Marketer: '📈',
  'Business Analyst': '💼',
  Other: '🚀',
};

const TOKEN_KEY = 'sm_token';
const PROFILE_KEY = 'sm_profile';

function mapProfile(raw: any): UserProfile {
  return {
    id:              raw.id,
    name:            raw.name,
    email:           raw.email,
    role:            raw.role,
    experienceLevel: raw.experience_level ?? raw.experienceLevel ?? '',
    bio:             raw.bio ?? '',
    location:        raw.location ?? '',
    skills:          raw.skills ?? [],
    interests:       raw.interests ?? [],
    emoji:           raw.emoji ?? '🚀',
    avatarUrl:       raw.avatar_url ?? raw.avatarUrl ?? null,
    isDiscoverable:  raw.is_discoverable ?? true,
  };
}

const AuthContext = createContext<AuthContextValue>({
  isLoggedIn: false,
  isLoading: true,
  profile: null,
  login: async () => {},
  loginWithGoogle: async () => {},
  register: async () => {},
  logout: async () => {},
  updateProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on app start
  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        const profileStr = await AsyncStorage.getItem(PROFILE_KEY);

        if (token && profileStr) {
          setAuthToken(token);
          setRealtimeSession(token);
          setProfile(JSON.parse(profileStr));

          // Verify token + refresh profile in background
          try {
            const fresh = await api.get<any>('/auth/me');
            const p = mapProfile(fresh);
            setProfile(p);
            await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(p));
          } catch {
            // Token expired — clear session
            await AsyncStorage.multiRemove([TOKEN_KEY, PROFILE_KEY]);
            setAuthToken(null);
            setProfile(null);
          }
        }
      } catch {}
      setIsLoading(false);
    })();
  }, []);

  const persist = async (token: string, p: UserProfile) => {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(p));
  };

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<any>('/auth/login', { email, password });
    const p = mapProfile(res.user);
    setAuthToken(res.access_token);
    setRealtimeSession(res.access_token);
    setProfile(p);
    await persist(res.access_token, p);
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const res = await api.post<any>('/auth/register', {
      name:             data.name,
      email:            data.email,
      password:         data.password,
      role:             data.role,
      experience_level: data.experienceLevel,
      skills:           data.skills,
      interests:        data.interests,
    });
    const p = mapProfile(res.user);
    setAuthToken(res.access_token);
    setRealtimeSession(res.access_token);
    setProfile(p);
    await persist(res.access_token, p);
  }, []);

  const logout = useCallback(async () => {
    setAuthToken(null);
    setRealtimeSession(null);
    setProfile(null);
    await AsyncStorage.multiRemove([TOKEN_KEY, PROFILE_KEY]);
  }, []);

  // Auto-logout on any 401 (expired token) from any API call
  useEffect(() => {
    setOnUnauthorized(logout);
  }, [logout]);

  const loginWithGoogle = useCallback(async () => {
    const redirectUri = Linking.createURL('auth');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectUri, skipBrowserRedirect: true },
    });
    if (error || !data.url) throw new Error(error?.message || 'Google sign-in failed');

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);
    if (result.type !== 'success') throw new Error('Sign-in was cancelled');

    const fragment = result.url.split('#')[1] || '';
    const access_token = new URLSearchParams(fragment).get('access_token');
    if (!access_token) throw new Error('No access token received');

    setAuthToken(access_token);
    setRealtimeSession(access_token);
    const fresh = await api.get<any>('/auth/me');
    const p = mapProfile(fresh);
    setProfile(p);
    await persist(access_token, p);
  }, []);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    const body: any = { ...updates };
    if ('experienceLevel' in body) {
      body.experience_level = body.experienceLevel;
      delete body.experienceLevel;
    }
    if ('avatarUrl' in body) {
      body.avatar_url = body.avatarUrl;
      delete body.avatarUrl;
    }
    const updated = await api.put<any>('/users/me', body);
    const p = mapProfile(updated);
    setProfile(p);
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(p));
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn: !!profile, isLoading, profile, login, loginWithGoogle, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
