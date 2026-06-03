import { Redirect, Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { useMatches } from '../../context/MatchesContext';
import { api } from '../../services/api';

const LAST_SEEN_KEY = 'notifications_last_seen';

export default function TabLayout() {
  const { isLoggedIn, isLoading, profile } = useAuth();
  const { likesCount, fetchLikesCount } = useMatches();
  const [notifBadge, setNotifBadge] = useState(0);

  useEffect(() => { fetchLikesCount(); }, [fetchLikesCount]);

  // Poll for unread notification count every 60s
  useEffect(() => {
    if (!profile) return;

    const refresh = async () => {
      try {
        const [items, lastSeenStr] = await Promise.all([
          api.get<any[]>('/notifications'),
          AsyncStorage.getItem(LAST_SEEN_KEY),
        ]);
        const lastSeen = lastSeenStr ? new Date(lastSeenStr) : null;
        const count = lastSeen
          ? items.filter(n => new Date(n.created_at) > lastSeen).length
          : items.length;
        setNotifBadge(count);
      } catch {}
    };

    refresh();
    const interval = setInterval(refresh, 60_000);
    return () => clearInterval(interval);
  }, [profile]);

  if (isLoading) return null;
  if (!isLoggedIn) return <Redirect href={'/login' as any} />;
  if (profile && profile.skills.length === 0 && profile.role === 'Other') {
    return <Redirect href={'/onboarding' as any} />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.bg,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingTop: 10,
          paddingBottom: 16,
          height: 70,
        },
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.muted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Discover',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>🔍</Text>,
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: 'Matches',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>💬</Text>,
          tabBarBadge: likesCount > 0 ? likesCount : undefined,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Activity',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>🔔</Text>,
          tabBarBadge: notifBadge > 0 ? notifBadge : undefined,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>👤</Text>,
        }}
      />
    </Tabs>
  );
}
