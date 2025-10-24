import { useState, useCallback, useEffect } from 'react';
import {
  initializeLocalData as initTeamFromDB,
  fetchLocalTeamData as fetchTeamFromDB,
} from '../services/local/teamService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';
import Constants from 'expo-constants';
import NetInfo from '@react-native-community/netinfo';
import { Alert } from 'react-native';


const API_BASE_URL = Constants.expoConfig.extra.API_BASE_URL;
const API_KEY = Constants.expoConfig.extra.API_KEY;

export function useTeam() {
  const [teamData, setTeamData] = useState<any>(null);
  const [charactersLocal, setCharactersLocal] = useState<any[]>([]);
  const [isComplete, setIsComplete] = useState<boolean>(false);

  const fetchLocalTeamData = useCallback(async () => {
    const team = await fetchTeamFromDB();
    setTeamData(team);
    return team;
  }, []);

  const initializeLocalData = useCallback(async () => {
    const { fullTeam, localCharacters } = await initTeamFromDB();

    if (fullTeam) setTeamData(fullTeam);
    setCharactersLocal(localCharacters || []);
  }, []);

    const getSlotId = (s: any) => (typeof s === 'string' ? s : s?.id ?? null);

    const enrichSlots = (slotsData: any, charactersMap: Record<string, any>) => {
        const enriched: Record<string, any> = {};
        for (const [slotName, slotValue] of Object.entries(slotsData || {})) {
            const id = getSlotId(slotValue);
            enriched[slotName] = id ? charactersMap[id] ?? null : null;
        }
        return enriched;
    };

  const addCharacterToSlot = async (characterId: string, slot: string) => {
    try {
        const token = await AsyncStorage.getItem('userToken');
        const db = await SQLite.openDatabaseAsync('nishin.db');

        const localTeam = await db.getFirstAsync('SELECT * FROM teams_local LIMIT 1');
        if (!localTeam) throw new Error('Aucune team locale trouvée.');

        let slots: any = localTeam.slots;
        if (typeof slots === 'string') { try { slots = JSON.parse(slots); } catch { slots = {}; } }

        const characters = await db.getAllAsync('SELECT * FROM characters_local');
        const charactersMap = Object.fromEntries(characters.map((c:any) => [c.id, c]));
        const character = charactersMap[characterId];
        if (!character) throw new Error('Personnage introuvable en local.');

        const validSlots = ['slot1', 'slot2', 'slot3', 'slot4'];
        if (!validSlots.includes(slot)) throw new Error('Slot invalide.');

        const isCharacterInTeam = Object.values(slots).some((s:any) => getSlotId(s) === character.id);
        if (isCharacterInTeam) throw new Error("Ce personnage est déjà dans l'équipe.");

        if (character.type === 'DPS') {
            if (!getSlotId(slots['slot1'])) slots['slot1'] = { id: character.id };
                else throw new Error('Le slot1 (DPS) est déjà occupé !');
            } else if (character.type === 'SUPPORT') {
                if (slot !== 'slot1' && !getSlotId(slots[slot])) slots[slot] = { id: character.id };
            else throw new Error('Slot invalide ou déjà pris pour un support.');
        } else {
        throw new Error('Type de personnage inconnu.');
        }


        await db.runAsync(
        'UPDATE teams_local SET slots = ?, updated_at = ?, dirty = 1 WHERE id = ?',
        [JSON.stringify(slots), new Date().toISOString(), localTeam.id]
        );

        
        const enrichedSlots = enrichSlots(slots, charactersMap);
        const fullTeam = { ...localTeam, slots: enrichedSlots };

        setTeamData(JSON.parse(JSON.stringify(fullTeam)));

        const state = await NetInfo.fetch();
        if (state.isConnected && token){
            try {
                await fetch(`${API_BASE_URL}/addCharacterToSlot`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ character_id: character.id, slot }),
                });
            } catch {
                // on ignore : la persistance locale est OK
            }
        }
    } catch (e:any) {
        console.error('addCharacterToSlot error:', e.message);
        Alert.alert('Erreur', e.message);
    }
    };

    const removeCharacter = async (characterId: string, slot: string) => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const db = await SQLite.openDatabaseAsync('nishin.db');
    
        const localTeam = await db.getFirstAsync('SELECT * FROM teams_local LIMIT 1');
        if (!localTeam) throw new Error('Aucune team locale trouvée.');
    
        let slots:any = localTeam.slots;
        if (typeof slots === 'string') { try { slots = JSON.parse(slots); } catch { slots = {}; } }
    
        // Rien dans le slot ? on sort proprement
        const currentId = getSlotId(slots[slot]);
        if (!currentId) return;
    
        // Si tu veux vraiment vérifier que c’est bien ce perso :
        if (characterId && currentId !== characterId) {
          console.warn('Le slot contient un autre personnage.');
          return;
        }
    
        // 1) Persist local
        slots[slot] = null;
        await db.runAsync(
          'UPDATE teams_local SET slots = ?, updated_at = ?, dirty = 1 WHERE id = ?',
          [JSON.stringify(slots), new Date().toISOString(), localTeam.id]
        );
    
        // 2) UI immédiate sans relecture
        const characters = await db.getAllAsync('SELECT * FROM characters_local');
        const charactersMap = Object.fromEntries(characters.map((c:any) => [c.id, c]));
        const enrichedSlots = enrichSlots(slots, charactersMap);
        const fullTeam = { ...localTeam, slots: enrichedSlots };
        setTeamData(JSON.parse(JSON.stringify(fullTeam)));
    
        // 3) Sync côté serveur si online (optionnelle)
        const state = await NetInfo.fetch();
        if (state.isConnected && token) {
          try {
            await fetch(`${API_BASE_URL}/removeCharacterFromSlot`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ slot, character_id: characterId }),
            });
          } catch { /* ignore offline */ }
        }
      } catch (e:any) {
        console.error('removeCharacter error:', e.message);
      }
    };


    const checkTeamComplete = useCallback(async (team?: any) => {
        const currentTeam = team || teamData || (await fetchLocalTeamData());
        if (!currentTeam) return setIsComplete(false);

        const expectedSlots = ['slot1', 'slot2', 'slot3', 'slot4'];

        const filled = expectedSlots.filter(slotName => {
            const slot = currentTeam.slots[slotName];
            return slot && typeof slot === 'object' && slot.id;
        });

        if (filled.length == expectedSlots.length) {
            setIsComplete(true);
        } else {
            console.log('❌ Erreur checkTeamCompletion:');
            setIsComplete(false);
        }
    }, [teamData]);


  return { teamData, charactersLocal, fetchLocalTeamData, initializeLocalData, addCharacterToSlot, removeCharacter, isComplete, checkTeamComplete };
}
