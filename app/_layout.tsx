import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../context/AuthContext';
import { MatchesProvider } from '../context/MatchesContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <MatchesProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="chat/[id]" />
          <Stack.Screen name="edit-profile" />
          <Stack.Screen name="create-idea" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="my-ideas" />
          <Stack.Screen name="idea-interests/[id]" />
          <Stack.Screen name="likes" />
          <Stack.Screen name="paywall" />
          <Stack.Screen name="settings" />
        </Stack>
      </MatchesProvider>
    </AuthProvider>
  );
}
