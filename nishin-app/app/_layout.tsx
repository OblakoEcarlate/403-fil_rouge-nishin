import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/hooks/useAuth';

export default function RootLayout() {
  const segments = useSegments();
  const router = useRouter();
  const { checkAuth, isLoggedIn } = useAuth();

  useEffect(() => {
    checkAuth();
  }, []);


  useEffect(() => {
    if (isLoggedIn === null) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isLoggedIn && !inAuthGroup) {
      router.replace('/(auth)/auth');
    } else if (isLoggedIn && inAuthGroup) {
      router.replace('/(tabs)');
    } else {
        router.replace('/(auth)/auth');
    }
  }, [isLoggedIn]);

  if (isLoggedIn === null) {
    return null;
  }

  return <Slot />;
}
