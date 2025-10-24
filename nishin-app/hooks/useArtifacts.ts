import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import React, { useState, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';


const API_BASE_URL = Constants.expoConfig.extra.API_BASE_URL;
const API_KEY = Constants.expoConfig.extra.API_KEY;

export function useArtifacts() {
    const [artifacts, setArtifacts] = useState([]); 

    const fetchArtifacts = useCallback(async (characterId: string) => {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) return null;

        const state = await NetInfo.fetch();
        if (state.isConnected && token){
            try {
                const response = await fetch(
                    `${API_BASE_URL}/getArtifactStat?character_id=${characterId}`,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );

                if (response.ok) {
                    const artifacts = await response.json();

                    setArtifacts(artifacts || []);
                    return artifacts || [];
                }
      
            } catch (fetchError) {
                console.log('⚠️ Erreur fetch artifacts');
            }
        }
    });

    const addArtifact = useCallback(async (characterId: string, artifactStat: string, slotArtifact: string) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (slotArtifact == "slot1") artifactStat = "HP";
            else if (slotArtifact == "slot2") artifactStat = "ATK";

            const state = await NetInfo.fetch();
            if (state.isConnected && token){
                await fetch(`${API_BASE_URL}/addArtifact`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        main_stat: artifactStat,
                        slot: slotArtifact,
                        character_id: characterId
                    })
                });
            }

            const updatedArtifact = await fetchArtifacts(characterId);

            setArtifacts(updatedArtifact);
            return updatedArtifact;
        } catch (error) {
            console.error("Erreur addArtifact:", error);
        }
    });


    const removeArtifact = async (characterId, slotArtifact) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            
            const state = await NetInfo.fetch();
            if (state.isConnected && token){
            await fetch(`${API_BASE_URL}/removeArtifact`, {
                method: 'DELETE',
                headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                character_id: characterId,
                slot: slotArtifact
                })
            });
            }

            const updatedArtifact = await fetchArtifacts(characterId);

            setArtifacts(updatedArtifact);
            return updatedArtifact;
        } catch (error) {
            console.error("❌ Erreur removeArtifact:", error);
        }
    };

    const fetchAndShowArtifacts = useCallback(async (characterId: string) => {
        const data = await fetchArtifacts(characterId);
        setArtifacts(data);
        return data;
    }, [fetchArtifacts]);

  return {
    artifacts,
    fetchArtifacts,
    fetchAndShowArtifacts,
    removeArtifact,
    addArtifact
  };
}