import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initDB } from '../services/database';

export default function RootLayout() {
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    initDB();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      setIsLoggedIn(!!token);
    } catch (error) {
      console.error('Erreur checkAuth:', error);
      setIsLoggedIn(false);
    }
  };

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
