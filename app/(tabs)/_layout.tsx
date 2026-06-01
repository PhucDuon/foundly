import { Redirect, Tabs } from 'expo-router';
import { Text } from 'react-native';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { useMatches } from '../../context/MatchesContext';

export default function TabLayout() {
  const { isLoggedIn, isLoading, profile } = useAuth();
  const { matches } = useMatches();

  if (isLoading) return null;
  if (!isLoggedIn) return <Redirect href={'/login' as any} />;
  // New Google (or incomplete) users must finish onboarding first
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
          tabBarBadge: matches.length > 0 ? matches.length : undefined,
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
