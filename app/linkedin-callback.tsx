import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export default function LinkedInCallback() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/(tabs)' as any);
  }, []);

  return null;
}
