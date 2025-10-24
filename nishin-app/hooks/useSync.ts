import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { maybeRunFullSync } from '../services/sync/syncManager';
import { pullChangesCharacters, pullChangesTeams } from '../services/sync/pullChanges';
import { deleteDatabase, setupDatabase } from '../services/database';
import React, { useEffect, useState, useRef } from 'react';
import { Alert } from 'react-native';

// TODO à voir pour le déplacer dans un autre hook
import { pushTeamChanges } from '../services/sync/pushChanges';


export function useSync(onSyncComplete?: () => Promise<any>) {
    const [isOnline, setIsOnline] = useState<boolean>(true);
    const [isSyncing, setIsSyncing] = useState<boolean>(false);

    const onSyncCompleteRef = useRef(onSyncComplete);
    useEffect(() => {
        onSyncCompleteRef.current = onSyncComplete;
    }, [onSyncComplete]);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(async (state) => {
            console.log('📡 Changement de réseau détecté:', state.isConnected);

            if (state.isConnected && state.type == "wifi") {

                setIsOnline(true);
                setIsSyncing(true);

                console.log('🌐 Reconnexion détectée : synchro auto...');

                const token = await AsyncStorage.getItem('userToken');
                if (!token) return;

                try {
                    await pullChangesCharacters(token);
                    await pullChangesTeams(token);
                    await pushTeamChanges(token);

                    if (onSyncComplete) await onSyncComplete();

                    console.log('✅ Synchro automatique réussie.');
                } catch (err: any) {
                    console.error('❌ Erreur de synchro automatique :', err.message);
                } finally {
                    setIsSyncing(false);
                }
            } else {
                Alert.alert("NON CONNECTE");
                setIsOnline(false);
            }
        });

        return () => unsubscribe();
    }, []);

    // Vérification de l'état du réseau
    useEffect(() => {
        const check = setInterval(async () => {
            const state = await NetInfo.fetch();
            // Alert.alert("🔌 Type de connexion:", state.type);
            console.log('🛰️ Etat réseau actuel:', state.isConnected);
        }, 3000);

    return () => clearInterval(check);
    }, []);

    // SYNC périodique
    useEffect(() => {
        const interval = setInterval(async () => {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) return;
    
            const state = await NetInfo.fetch();
            if (state.isConnected) {
                console.log('🕒 Synchro périodique...');
                try {
                    await pullChangesCharacters(token);
                    await pullChangesTeams(token);
                    await pushTeamChanges(token);

                    if (onSyncComplete) await onSyncComplete();
                } catch (err: any) {
                    console.warn('⚠️ Synchro périodique échouée:', err.message);
                }
            }
        }, 5 * 1000); 
    
    return () => clearInterval(interval);
    }, []);

    // Chargement des données locales
    useEffect(() => {
        (async () => {
            const token = await AsyncStorage.getItem('userToken');

            try {
                // Si bug avec la bdd locale dé-commenter ces 2 lignes
                // await deleteDatabase();
                // await setupDatabase();
                console.log('🌐 Synchro initiale...');
                await maybeRunFullSync(token);
                await pullChangesCharacters(token);
                await pullChangesTeams(token);
                await pushTeamChanges(token);

                if (onSyncComplete) await onSyncComplete();

                console.log('💾 Rechargement des données locales terminé.');
            } catch (err: any) {
                console.error('❌ Erreur de synchronisation initiale:', err.message);
            }
        })();
    }, []);

    return { isOnline, isSyncing };
}