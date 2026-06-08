import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

// Handles the OAuth redirect deep link (startupmatch://auth)
// maybeCompleteAuthSession closes the browser and returns control to the app
WebBrowser.maybeCompleteAuthSession();

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to tabs if somehow this screen renders
    router.replace('/(tabs)' as any);
  }, []);

  return null;
}
