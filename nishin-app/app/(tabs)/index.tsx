import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, FlatList, Pressable, Modal, ActivityIndicator, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, AppState, Alert } from 'react-native';
import Constants from 'expo-constants';
import {Picker} from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { checkTables, describeTable, dumpCharacters, testDatabaseConnection, dumpTeams } from '../../services/debug';
import { maybeRunFullSync } from '../../services/sync/syncManager';
import { pullChangesCharacters, pullChangesTeams } from '../../services/sync/pullChanges';
import { deleteDatabase, setupDatabase } from '../../services/database';
import * as SQLite from 'expo-sqlite';

const API_BASE_URL = Constants.expoConfig.extra.API_BASE_URL;
const API_KEY = Constants.expoConfig.extra.API_KEY;

export default function NishinScreen() {
    const [teamData, setTeamData] = useState(null);
    const [error, setError] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [selectedSlotData, setSelectedSlotData] = useState(null);
    const [selectedSlotForArtifacts, setSelectedSlotForArtifacts] = useState(null);
    const [artifactModalVisible, setArtifactModalVisible] = useState(false);
    const [artifactsData, setArtifactsData] = useState(null);
    const [selectedSlotForPicker, setSelectedSlotForPicker] = useState(null);
    const [selectedStat, setSelectedStat] = useState('');
    const [basicDamage, setBasicDamage] = useState(null);
    const [artifactDamage, setArtifactDamage] = useState(null);
    const [damage, setDamage] = useState(null);
    const [charactersLocal, setCharactersLocal] = useState(null);
    const [isOnline, setIsOnline] = useState(true);
    // A VOIR POUR LUI
    // const [syncStatus, setSyncStatus] = useState('');
    const router = useRouter();

    const characterImages = {
        'ayaka': require('../../assets/personnages/ayaka.webp'),
        'ayato': require('../../assets/personnages/ayato.webp'),
        'bennett': require('../../assets/personnages/bennett.webp'),
        'citlali': require('../../assets/personnages/citlali.webp'),
        'diona': require('../../assets/personnages/diona.webp'),
        'furina': require('../../assets/personnages/furina.webp'),
        'ganyu': require('../../assets/personnages/ganyu.webp'),
        'kazuha': require('../../assets/personnages/kazuha.webp'),
        'neuvillette': require('../../assets/personnages/neuvillette.webp'),
        'sucrose': require('../../assets/personnages/sucrose.webp'),
        'xiangling': require('../../assets/personnages/xiangling.webp'),
        'yanfei': require('../../assets/personnages/yanfei.webp'),
        'yoimiya': require('../../assets/personnages/yoimiya.webp'),
        'plus': require('../../assets/icone/plus.png')
    };

    const artifactImages = {
        'slot1': require('../../assets/artefact/fleur.webp'),
        'slot2': require('../../assets/artefact/plume.png'),
        'slot3': require('../../assets/artefact/sablier.webp'),
        'slot4': require('../../assets/artefact/coupe.png'),
        'slot5': require('../../assets/artefact/casque.png'),
    };

    const getSlotId = (s: any) => (typeof s === 'string' ? s : s?.id ?? null);

    const enrichSlots = (slotsData: any, charactersMap: Record<string, any>) => {
    const enriched: Record<string, any> = {};
    for (const [slotName, slotValue] of Object.entries(slotsData || {})) {
        const id = getSlotId(slotValue);
        enriched[slotName] = id ? charactersMap[id] ?? null : null;
    }
    return enriched;
    };


// const fetchTeam = async () => {
//     try {
//         const token = await AsyncStorage.getItem('userToken');
//         if (!token) return null;

//         if (isOnline) {
//             try {
//                 const response = await fetch(`${API_BASE_URL}/getTeam`, {
//                     method: 'GET',
//                     headers: {
//                         'Content-Type': 'application/json',
//                         'Authorization': `Bearer ${token}`
//                     },
//                 });

//                 if (response.ok) {
//                     const data = await response.json();
//                     setTeamData(data);
//                     return data;
//                 }
//             } catch (fetchError) {
//                 console.warn('⚠️ Erreur fetch, basculement sur cache local');
//             }
//         }

//         // TODO : faire la fonction pour hors ligne

//     } catch (error) {
//         console.error('❌ Erreur fetch team:', error);
//         return null;
//     }
// };

// const fetchCharacters = async () => {
//     try {
//         const token = await AsyncStorage.getItem('userToken');
//         if (!token) return null;

//         if (isOnline) {
//             const response = await fetch(`${API_BASE_URL}/getAllCharacters`, {
//                 method: 'GET',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Bearer ${token}`
//                 },
//             });
//             const data = await response.json();

//             setCharactersLocal(data);
            
//             return data;
//         }

//         // TODO : faire la fonction hors ligne
    
//     } catch (error) {
//         console.error('❌ Erreur fetch characters:', error);
//         return null;
//     }
// };






const fetchArtifacts = async (characterId) => {
    const token = await AsyncStorage.getItem('userToken');
    if (!token) return null;

    if (isOnline) {
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

                setArtifactsData(artifacts);
                return artifacts;
            }
        } catch (fetchError) {
            console.log('⚠️ Erreur fetch artifacts');
        }
    }
};



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


const addCharacterToSlot = async (characterId: string, slot: string) => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    const db = await SQLite.openDatabaseAsync('nishin.db');

    // --- Lire team + persos (une seule fois)
    const localTeam = await db.getFirstAsync('SELECT * FROM teams_local LIMIT 1');
    if (!localTeam) throw new Error('Aucune team locale trouvée.');

    let slots: any = localTeam.slots;
    if (typeof slots === 'string') { try { slots = JSON.parse(slots); } catch { slots = {}; } }

    const characters = await db.getAllAsync('SELECT * FROM characters_local');
    const charactersMap = Object.fromEntries(characters.map((c:any) => [c.id, c]));
    const character = charactersMap[characterId];
    if (!character) throw new Error('Personnage introuvable en local.');

    // --- Règles métier identiques au back
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

    // --- 1) Écrit en base (persistance offline)
    await db.runAsync(
      'UPDATE teams_local SET slots = ?, updated_at = ?, dirty = 1 WHERE id = ?',
      [JSON.stringify(slots), new Date().toISOString(), localTeam.id]
    );

    // --- 2) UI immédiate : enrichis en mémoire et setState (PAS de relecture DB)
    const enrichedSlots = enrichSlots(slots, charactersMap);
    const fullTeam = { ...localTeam, slots: enrichedSlots };
    // Important : s’assurer d’une nouvelle référence
    setTeamData(JSON.parse(JSON.stringify(fullTeam)));
    refreshDamage();
    closeModal();

    // --- 3) Optionnel : tenter la sync si online (mais l’UI est déjà à jour)
    if (isOnline && token) {
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


const addArtifact = async (characterId, artifactStat, slotArtifact) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (slotArtifact == "slot1") artifactStat = "HP";
            else if (slotArtifact == "slot2") artifactStat = "ATK";

            if (isOnline) {
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
            setArtifactModalVisible(false);
            // TODO : voir fetchAndShowArtifacts()
            // fetchAndShowArtifacts();
            setArtifactsData(updatedArtifact);
            refreshDamage();
        } catch (error) {
            console.error("Erreur addArtifact:", error);
        }
    };


const removeArtifact = async (characterId, slotArtifact) => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    if (isOnline) {
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

    const updatedArtifacts = await fetchArtifacts(characterId);
    setArtifactsData(updatedArtifacts);
    setArtifactModalVisible(false);
    refreshDamage();
  } catch (error) {
    console.error("❌ Erreur removeArtifact:", error);
  }
};


const initializeLocalData = async () => {
  const db = await SQLite.openDatabaseAsync('nishin.db');
  console.log('🚀 Initialisation locale des données...');

  try {
    const localTeam = await db.getFirstAsync('SELECT * FROM teams_local LIMIT 1');

    if (localTeam) {
      console.log('📂 Team locale trouvée :', localTeam.id);

      const characters = await db.getAllAsync('SELECT * FROM characters_local');
      const charactersMap = Object.fromEntries(characters.map(c => [c.id, c]));

      // 🔍 1. Parser proprement les slots
      let slotsData = localTeam.slots;
      if (typeof slotsData === 'string') {
        try {
          slotsData = JSON.parse(slotsData);
        } catch (e) {
          console.warn('⚠️ Erreur de parsing JSON des slots:', e);
          slotsData = {};
        }
      }

      // 🔍 2. Reconstruire chaque slot avec les bons persos
      const enrichedSlots: Record<string, any> = {};

      for (const [slotName, slotValue] of Object.entries(slotsData)) {
        if (!slotValue) {
          enrichedSlots[slotName] = null;
          continue;
        }

        // Supporte les deux formats : id direct ou objet { _id }
        const charId =
          typeof slotValue === 'string'
            ? slotValue
            : slotValue._id ?? slotValue.id;

        const fullChar = charactersMap[charId] || null;
        enrichedSlots[slotName] = fullChar;
      }

      const fullTeam = {
        ...localTeam,
        slots: enrichedSlots,
      };

      setTeamData(fullTeam);
      console.log('✅ Team enrichie :', fullTeam);
    } else {
      console.log('⚠️ Aucune team locale trouvée');
      setTeamData(null);
    }

    // Charger les personnages locaux
    const localCharacters = await db.getAllAsync('SELECT * FROM characters_local');

    if (localCharacters.length > 0) {
      console.log(`📦 ${localCharacters.length} personnages locaux chargés`);
      setCharactersLocal(localCharacters);
    } else {
      console.log('⚠️ Aucun personnage local trouvé');
      setCharactersLocal([]);
    }

    console.log('✅ Initialisation locale terminée');
  } catch (error) {
    console.error('❌ Erreur initialisation locale :', error.message);
  }
};


const fetchLocalTeamData = async () => {
  try {
    const db = await SQLite.openDatabaseAsync('nishin.db');
    console.log('🚀 Fetch locale des données de team...');

    const localTeam = await db.getFirstAsync('SELECT * FROM teams_local LIMIT 1');
    if (!localTeam) {
      console.log('⚠️ Aucune team locale trouvée');
      setTeamData(null);
      return null;
    }

    console.log('📂 Team locale trouvée :', localTeam.id);

    // Charger les persos locaux
    const characters = await db.getAllAsync('SELECT * FROM characters_local');
    const charactersMap = Object.fromEntries(characters.map(c => [c.id, c]));

    // 🔍 Parser les slots proprement
    let slotsData: any = {};
    if (localTeam.slots) {
      try {
        slotsData = typeof localTeam.slots === 'string'
          ? JSON.parse(localTeam.slots)
          : localTeam.slots;
      } catch (err) {
        console.warn('⚠️ Erreur parsing JSON des slots :', err);
        slotsData = {};
      }
    }

    // 🔍 Reconstruire les slots enrichis
    const enrichedSlots: Record<string, any> = {};
    for (const [slotName, slotValue] of Object.entries(slotsData)) {
      if (!slotValue) {
        enrichedSlots[slotName] = null;
        continue;
      }

      // Toujours utiliser .id (pas _id)
      const charId =
        typeof slotValue === 'string' ? slotValue : slotValue.id;

      enrichedSlots[slotName] = charactersMap[charId] || null;
    }

    const fullTeam = {
      ...localTeam,
      slots: enrichedSlots,
    };

    console.log('✅ Team enrichie prête :', fullTeam);
    setTeamData(fullTeam);
    return fullTeam;
  } catch (error: any) {
    console.error('❌ Erreur fetchLocalTeamData :', error.message);
    setTeamData(null);
    return null;
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
    refreshDamage();

    // 3) Sync côté serveur si online (optionnelle)
    if (isOnline && token) {
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


    async function getBasicDamage() {
        try {
            const token = await AsyncStorage.getItem('userToken');  
            const response = await fetch(`${API_BASE_URL}/simulateBasicDamageForDPS`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    },
                });

            const basicDamage = await response.json();
            return basicDamage;
        } catch (error) {
            console.error('Erreur basic damage: ', error);
        }
    };


    async function getArtifactDamage() {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_BASE_URL}/simulateDamageWithArtifact`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    },
                });

            const artifactDamage = await response.json();
            return artifactDamage;
        } catch (error) {
            console.error('Erreur calculs artefacts: ', error);
        }
    };

    async function getDamage() {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_BASE_URL}/simulateDamageForDPS`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                    },
                });

            const damage = await response.json();
            return damage;
        } catch (error) {
            console.error('Erreur calculs damage: ', error);
        }
    };

// BASIC DAMAGE -------------------------------------------------------------------------------
    const refreshDamage = useCallback(async () => {
        const value = await getBasicDamage();
        setBasicDamage(value);

        const artifactValue = await getArtifactDamage();
        setArtifactDamage(artifactValue);

        const damage = await getDamage();
        setDamage(damage);
      }, []);


    // TODO : a voir si on a besoin de ça ? c'est pour les alertes voir si on a de la connection ou pas et setIsOnline
    useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(async (state) => {
        if (state.isConnected) {
        console.log('🌐 Reconnexion détectée : synchro auto...');

        const token = await AsyncStorage.getItem('userToken');
        if (!token) return;

        try {
            // await pushChanges(token); // envoie d’abord les modifs locales
            await pullChangesCharacters(token);
            await pullChangesTeams(token);
            console.log('✅ Synchro automatique réussie.');
        } catch (err) {
            console.error('❌ Erreur de synchro automatique :', err.message);
        }
        }
    });

    return () => unsubscribe();
    }, []);

    // TODO : useEffect de nos test ! provient de index sur discord
    // useEffect(() => {
    //     (async () => {
    //         const token = await AsyncStorage.getItem('userToken');
    //         try {
    //             // await deleteDatabase();
    //             // await setupDatabase();
    //             // await testDatabaseConnection();
    //             // await checkTables();
    //             // await describeTable();
    //             // await testInsertCharacter();
    //             await maybeRunFullSync(token);

    //             await pullChangesCharacters(token);
    //             await dumpCharacters();

    //             await pullChangesTeams(token);
    //             await dumpTeams();

    //             await initializeLocalData();
    //             // await fetchTeam();
    //             // await fetchCharacters();
    //         } catch (err: any) {
    //             console.error('Erreur de synchronisation initiale:', err.message);
    //         }
    //     })();
    // }, []);

    useEffect(() => {
        (async () => {
            const token = await AsyncStorage.getItem('userToken');

            try {
            // await deleteDatabase();
            // await setupDatabase();
            console.log('🌐 Synchro initiale...');
            await maybeRunFullSync(token);
            await pullChangesCharacters(token);
            await pullChangesTeams(token);


            console.log('💾 Rechargement des données locales...');
            await initializeLocalData();
            } catch (err) {
            console.error('❌ Erreur de synchronisation initiale:', err.message);
            }
        })();
        }, []);

    useEffect(() => {
    const interval = setInterval(async () => {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) return;

        const state = await NetInfo.fetch();
        if (state.isConnected) {
        console.log('🕒 Synchro périodique...');
        try {
            // await pushChanges(token);
            await pullChangesCharacters(token);
            await pullChangesTeams(token);
        } catch (err) {
            console.warn('⚠️ Synchro périodique échouée:', err.message);
        }
        }
    }, 5 * 60 * 1000); // toutes les 5 minutes

    return () => clearInterval(interval);
    }, []);



    const handleSlotPress = (slot, slotData) => {
        setSelectedSlot(slot);
        setSelectedSlotData(slotData);
        if (slotData == null) {
            setModalVisible(true);
        } else {
            setModalVisible(false);
            // TODO : voir pour cette fonction en dessous
            fetchAndShowArtifacts(slotData.id, slot);
        }
      };

      const closeModal = () => {
        setModalVisible(false);
        setSelectedSlot(null);
        setSelectedSlotData(null);
      };


// TODO : check pour teamData apparemment y'a pas besoin ?
    const handleLongPress = (characterId, slot) => {
        // TODO : visiblement removeCharacter n'a pas besoin de teamData en paramètre
        removeCharacter(characterId, slot);
    };

    const handleAddArtifact = (slotArtifact) => {
        setSelectedSlotForPicker(slotArtifact);
        setArtifactModalVisible(true);
        setSelectedStat('');
    };

    // TODO : fonction suspicieuse
  const fetchAndShowArtifacts = async (characterId, slot) => {
      try {
          const artifacts = await fetchArtifacts(characterId);
          setArtifactsData(artifacts);
          setSelectedSlotForArtifacts(slot);
      } catch (error) {
          console.error('Erreur récupération artéfacts:', error);
      }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>
                      {!isOnline && '📡 Hors ligne'}
                      {isOnline && 'En ligne'}
                    </Text>
                  </View>

        <Pressable onPress={() => logout()}><Text>Déconnexion</Text></Pressable>

        <Text style={styles.title}>Nishin</Text>

        <View style={{ marginHorizontal: 15}}>
        <Text style={styles.sectionLabel}>Équipe</Text>
        <View style={styles.teamRow}>
            <SlotCard charactersLocal={teamData?.slots?.slot1} slot='slot1' onSlotPress={handleSlotPress} characterImages={characterImages} onLongPress={handleLongPress}/>
            <SlotCard charactersLocal={teamData?.slots?.slot2} slot='slot2' onSlotPress={handleSlotPress} characterImages={characterImages} onLongPress={handleLongPress}/>
            <SlotCard charactersLocal={teamData?.slots?.slot3} slot='slot3' onSlotPress={handleSlotPress} characterImages={characterImages} onLongPress={handleLongPress}/>
            <SlotCard charactersLocal={teamData?.slots?.slot4} slot='slot4' onSlotPress={handleSlotPress} characterImages={characterImages} onLongPress={handleLongPress}/>
        </View>


        <Modal
            style={styles.modalCharacters}
            animationType="slide"
            visible={modalVisible}
            onRequestClose={closeModal}
        >
            <View>


                <Text style={styles.modalTitle}>
                    Choisir un personnage {!isOnline && '(Mode hors ligne)'}
                </Text>
<Pressable onPress={closeModal}>
                    <Text>✕</Text>
                </Pressable>
                <View style={styles.containerModal}>
                    <FlatList
                        vertical
                        data={charactersLocal}
                        contentContainerStyle={styles.listContainer}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({item}) => (
                            <View style={styles.containerImage}>
                                <Pressable onPress={() => addCharacterToSlot(item.id.toString(), selectedSlot)}>
                                    <Image
                                        source={characterImages[item.name?.toLowerCase()]}
                                        style={styles.characterImage}
                                    />
                                    <Text>{item.name}</Text>
                                </Pressable>
                            </View>
                        )}
                        ListEmptyComponent={
                            <Text style={{textAlign: 'center', marginTop: 50}}>
                                {isOnline
                                    ? '⏳ Chargement des personnages...'
                                    : '📂 Aucun personnage en cache'}
                            </Text>
                        }
                    />
                </View>
            </View>
        </Modal>

        <Accordion title="Artéfacts">
          <View style={styles.artifactRow}>
            {artifactsData && Object.entries(artifactsData).map(([slot, artifactData]) => (
              <ArtifactCard
                key={slot}
                slot={slot}
                artifactData={artifactData}
                characterId={selectedSlotData?.id}
                artifactImages={artifactImages}
                onAddArtifact={handleAddArtifact}
              />
            ))}
          </View>
        </Accordion>

        <Modal
            visible={artifactModalVisible}
            animationType="slide"
            onRequestClose={() => setArtifactModalVisible(false)}
        >
            <View style={styles.modalContainer}>
                <Pressable
                    style={styles.closeButton}
                    onPress={() => setArtifactModalVisible(false)}
                >
                    <Text style={styles.closeText}>X</Text>
                </Pressable>

                <Text style={styles.modalTitle}>
                    Ajouter un artéfact - Slot {selectedSlotForPicker?.replace('slot', '')}
                </Text>

                {selectedSlotForPicker === 'slot3' && (
                    <Picker
                        selectedValue={selectedStat}
                        onValueChange={(itemValue) => setSelectedStat(itemValue)}
                    >
                        <Picker.Item label="PV%" value="HP%" />
                        <Picker.Item label="ATQ%" value="ATK%" />
                        <Picker.Item label="Maîtrise Élémentaire" value="EM" />
                    </Picker>
                )}

                {selectedSlotForPicker === 'slot4' && (
                    <Picker
                        selectedValue={selectedStat}
                        onValueChange={(itemValue) => setSelectedStat(itemValue)}
                    >
                        <Picker.Item label="PV%" value="HP%" />
                        <Picker.Item label="ATQ%" value="ATK%" />
                        <Picker.Item label="Maîtrise Élémentaire" value="EM" />
                        <Picker.Item label="Bonus DGT Élémentaire" value="Elemental" />
                    </Picker>
                )}

                {selectedSlotForPicker === 'slot5' && (
                    <Picker
                        selectedValue={selectedStat}
                        onValueChange={(itemValue) => setSelectedStat(itemValue)}
                    >
                        <Picker.Item label="PV%" value="HP%" />
                        <Picker.Item label="ATQ%" value="ATK%" />
                        <Picker.Item label="Maîtrise Élémentaire" value="EM" />
                    </Picker>
                )}

                {(selectedSlotForPicker === 'slot1' || selectedSlotForPicker === 'slot2') && (
                    <Text style={styles.fixedStatText}>
                        {selectedSlotForPicker === 'slot1' ? 'Stat fixe: HP' : 'Stat fixe: ATQ'}
                    </Text>
                )}

                <View style={styles.modalButtons}>
                    <Pressable
                        style={[styles.cancelButton]}
                        onPress={() => setArtifactModalVisible(false)}
                    >
                        <Text style={{ color: '#d66', fontWeight: '600'}}>Annuler</Text>
                    </Pressable>
                    <Pressable
                        style={[styles.confirmButton]}
                        onPress={() => addArtifact(selectedSlotData.id, selectedStat, selectedSlotForPicker)}
                    >
                        <Text style={{ color: '#fff', fontWeight: '600'}}>Ajouter</Text>
                    </Pressable>
                    <Pressable
                        style={[styles.deleteButton]}
                        onPress={() => removeArtifact(selectedSlotData.id, selectedSlotForPicker)}
                    >
                        <Text style={{ color: '#fff', fontWeight: '600'}}>Supprimer</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>




        <Accordion title="Réaction élémentaire" defaultOpen>
          <View style={styles.reactionBox}>
            <CircleWithText text={'?'} />
            <Text style={styles.plus}> + </Text>
            <CircleWithText text={'?'} />
          </View>
          <Text style={styles.muted}>Compose ton équipe pour connaître la réaction</Text>
        </Accordion>

        <Text style={styles.sectionLabel}>Dégâts estimés avec Nom</Text>

        {basicDamage == null ? (
          <View style={styles.damageBox}>
            <Text style={styles.damageText}>
              Compose ton équipe pour connaître les dégâts de ton DPS
            </Text>
          </View>
        ) : (
          <View style={styles.damageBox}>
            <Text>Dégâts compétence : {basicDamage}</Text>
            <Text>Dégâts avec artéfacts : {artifactDamage}</Text>
            <Text>Dégâts de compétence estimés : {damage}</Text>
          </View>
        )}




         <TouchableOpacity
                style={{ marginTop: 16, backgroundColor: '#222', padding: 12, borderRadius: 8 }}
                onPress={() => refreshDamage()}
         >
             <Text style={{ color: 'white' }}>Mettre à jour !</Text>
         </TouchableOpacity>


        {/* fonction du onPress à refaire avec la nouveauté */}
            <TouchableOpacity
              style={[styles.syncButton, !isOnline && styles.syncButtonDisabled]}
              disabled={!isOnline}
            >
              <Text style={styles.syncButtonText}>
                {isOnline ? '🔄 Synchroniser' : '📡 Hors ligne'}
              </Text>
            </TouchableOpacity>

        <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}


function Accordion({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={{ marginTop: 16 }}>
      <TouchableOpacity onPress={() => setOpen(v => !v)} style={styles.accordionHeader}>
        <Text style={styles.sectionLabel}>{title}</Text>
        <Text style={styles.chevron}>{open ? '▴' : '▾'}</Text>
      </TouchableOpacity>
      {open && <View style={styles.accordionBody}>{children}</View>}
    </View>
  );
}

function CircleWithText({ text }: { text: string }) {
  return (
    <View style={styles.circle}>
      <Text style={styles.circleText}>{text}</Text>
    </View>
  );
}

function SlotCard({charactersLocal, slot, onSlotPress, onLongPress, characterImages, teamData}) {
  const handlePress = () => {
      if (onSlotPress) {
        onSlotPress(slot, charactersLocal);
      }
    };
  const handleLong = () => {
    if (charactersLocal && onLongPress) {
        onLongPress(charactersLocal.id, slot, teamData);
    }
  }

  return (
    <TouchableOpacity style={styles.slotCard} onPress={handlePress} onLongPress={handleLong}>
          <Image
                  source={characterImages[charactersLocal?.name.toLowerCase()] || characterImages.plus}
                  style={styles.characterImageInSlot}
                />
          <Text style={styles.slot}>{charactersLocal?.name ?? ''}</Text>
                <Text style={styles.role}>{charactersLocal?.type}</Text>
    </TouchableOpacity>
  );
}

function ArtifactCard({ slot, artifactData, artifactImages, onAddArtifact }) {
    const artifactImage = artifactImages[slot] || require('../../assets/icone/plus.png');

    return (
        <TouchableOpacity
            style={styles.artifactCard}
        >
            <View style={styles.containerArtifactImage}>
                <Pressable onPress={() => onAddArtifact(slot)}>
                    {artifactData && Object.keys(artifactData).length > 0 ? (
                        <>
                            <Image
                                source={artifactImage}
                                style={styles.artifactImage}
                            />
                            <Text style={styles.artifactText}>
                                {artifactData.stat_name ? artifactData.stat_name : artifactData.main_stat}
                            </Text>
                            <Text style={styles.artifactText}>
                                {artifactData.stat_value}
                            </Text>
                        </>
                    ) : (
                        <>
                            <Image
                                source={require('../../assets/icone/plus.png')}
                                style={styles.artifactImage}
                            />
                            <Text style={styles.artifactText}>
                                Slot {slot.replace('slot', '')}
                            </Text>
                        </>
                    )}
                </Pressable>
            </View>
        </TouchableOpacity>
    );
}


const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 16 },
  title: { fontSize: 32, fontWeight: '600', textAlign: 'center', marginVertical: 8 },
  sectionLabel: { fontSize: 16, fontWeight: '600', marginTop: 12 },
  teamRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  slotCard: {
    flex: 1,
    backgroundColor: '#eee',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusBig: { fontSize: 28, color: '#333' },
  slotName: { marginTop: 4, fontSize: 14, fontWeight: '600' },
  role: { marginTop: 2, fontSize: 12, color: '#666' },
  accordionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  accordionBody: { backgroundColor: '#eee', borderRadius: 8, padding: 12, marginTop: 8 },
  reactionBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  plus: { fontSize: 22, marginHorizontal: 8 },
  circle: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: '#000', alignItems: 'center', justifyContent: 'center' },
  circleText: { fontSize: 18, fontWeight: '700' },
  muted: { marginTop: 8, color: '#666' },
  damageBox: { borderWidth: 3, borderColor: '#d66', borderRadius: 8, padding: 12, marginTop: 8 },
  damageText: { color: '#333' },
  error: { color: '#b00020', marginTop: 8 },
  reloadBtn: { alignSelf: 'center', marginTop: 12, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#111', borderRadius: 8 },
  reloadText: { color: '#fff', fontWeight: '600' },
  chevron: { fontSize: 16 },
  modalCharacters: { marginHorizontal: 20, marginVertical: 30},
  characterImage: { height: 100, width: 100},
  containerImage: { flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' },
  containerModal: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center'},
  listContainer: { marginHorizontal: 15, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between'},
  titleModalCharacter: { marginVertical: 30, fontSize: 26, fontWeight: '600', textAlign: 'center' },
  characterImageInSlot: { height: 60, width: 60 },
  artifactRow: { flexDirection: 'row', gap: 12, marginTop: 2, alignItems: 'center', justifyContent: 'center'},
  artifactImage: { height: 60, width: 60 },
  artifactText: { textAlign: 'center' },
  close: { fontSize: 30 },
  modalContainer: { marginVertical: 50, marginHorizontal: 10 },
  modalTitle: { textAlign: 'center', fontWeight: '600', fontSize: 20, marginVertical: 20},
  fixedStatText: {textAlign: 'center', fontSize: 10 },
  modalButtons: {flexDirection: 'row', gap: 20, marginVertical: 200, alignItems: 'center', justifyContent: 'center'},
  cancelButton: { borderColor: '#d66', borderWidth: 2, borderRadius: 8, padding: 10, alignItems: 'center', justifyContent: 'center', width: 120 },
  confirmButton: { backgroundColor: '#d66', borderRadius: 8, padding: 10, width: 120, alignItems: 'center', justifyContent: 'center'},
  deleteButton: { backgroundColor: '#000', borderRadius: 8, padding: 10, width: 120, alignItems: 'center', justifyContent: 'center' },
//   STYLE A VOIR
  statusBadge: {
      backgroundColor: '#f0f0f0',
      padding: 8,
      borderRadius: 8,
      marginHorizontal: 15,
      marginTop: 10,
      alignItems: 'center'
    },
    statusText: {
      fontSize: 12,
      color: '#666',
      fontWeight: '600'
    },
    syncButton: {
      backgroundColor: '#4CAF50',
      padding: 12,
      borderRadius: 8,
      marginHorizontal: 15,
      marginTop: 16,
      alignItems: 'center'
    },
    syncButtonDisabled: {
      backgroundColor: '#ccc'
    },
    syncButtonText: {
      color: '#fff',
      fontWeight: '600',
      fontSize: 16
    }
});