import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { MatchesProvider } from '../context/MatchesContext';
import { api } from '../services/api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function registerForPushNotifications(): Promise<string | null> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch (e) {
    console.warn('[push] token unavailable:', e);
    return null;
  }
}

function PushRegistrar() {
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    if (!isLoggedIn) return;
    registerForPushNotifications().then(token => {
      if (token) {
        api.post('/users/me/push-token', { token }).catch(() => {});
      }
    });
  }, [isLoggedIn]);

  return null;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <MatchesProvider>
        <StatusBar style="light" />
        <PushRegistrar />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="chat/[id]" />
          <Stack.Screen name="edit-profile" />
          <Stack.Screen name="create-idea" />
          <Stack.Screen name="likes" />
        </Stack>
      </MatchesProvider>
    </AuthProvider>
  );
}
