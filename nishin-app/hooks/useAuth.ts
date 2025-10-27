import Constants from 'expo-constants';
import { useRouter, useSegments } from 'expo-router';
import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = Constants.expoConfig.extra.API_BASE_URL;
const API_KEY = Constants.expoConfig.extra.API_KEY;
    
export function useAuth() {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
    const segments = useSegments();
    const router = useRouter();

    const logout = async () => {
        const token = await AsyncStorage.getItem('userToken');
        try {
            await fetch(`${API_BASE_URL}/logout`, {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
                },
            });

            await AsyncStorage.removeItem('userToken');
            router.replace('/(auth)/auth');
        } catch (error) {
            console.error('❌ Erreur déconnexion:', error);
            await AsyncStorage.removeItem('userToken');
            router.replace('/(auth)/auth');
        }
    };

   const checkAuth = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            setIsLoggedIn(!!token);
        } catch (error) {
            console.error('Erreur checkAuth:', error);
            setIsLoggedIn(false);
        }
    };


    return { checkAuth, isLoggedIn, logout };
}
  
  