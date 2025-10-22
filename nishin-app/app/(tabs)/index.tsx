import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, FlatList, Pressable, Modal, ActivityIndicator, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, AppState, Alert } from 'react-native';
import Constants from 'expo-constants';
import {Picker} from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

import { initDB, saveTeamSlot, removeTeamSlot, saveArtifact, removeArtifactLocal, loadBaseCharacters } from '../../services/database';
import { syncWithServer } from '../../services/sync';
import * as SQLite from 'expo-sqlite';

const API_BASE_URL = Constants.expoConfig.extra.API_BASE_URL;
const API_KEY = Constants.expoConfig.extra.API_KEY;

export default function NishinScreen() {
    const [teamData, setTeamData] = useState(null);
    const [error, setError] = useState(null);
    const [charactersData, setCharactersData] = useState(null);
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
    const [charactersLocal, setCharactersLocal] = useState([]);


//     SYNC
    const [isOnline, setIsOnline] = useState(true);
    const [syncStatus, setSyncStatus] = useState('');
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


const fetchTeam = async () => {
    try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) return null;

        // 1️⃣ Si en ligne : fetch API
        if (isOnline) {
            try {
                const response = await fetch(`${API_BASE_URL}/getTeam`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                });

                if (response.ok) {
                    const data = await response.json();

                    // 💾 Sauvegarder dans la DB locale
                    const db = await SQLite.openDatabaseAsync('genshin_nishin.db');
                    await db.runAsync(
                        `INSERT OR REPLACE INTO teams_local (id, user_id, slots, updated_at, dirty)
                         VALUES (?, ?, ?, ?, 0)`,
                        [
                            'main_team',
                            data.user_id || 'unknown',
                            JSON.stringify(data.slots || {}),
                            Math.floor(Date.now() / 1000)
                        ]
                    );

                    return data;
                }
            } catch (fetchError) {
                console.warn('⚠️ Erreur fetch, basculement sur cache local');
            }
        }

        // 2️⃣ Si hors ligne OU erreur : charger depuis SQLite
        console.log('📂 Chargement depuis la base locale...');
        const db = await SQLite.openDatabaseAsync('genshin_nishin.db');
        const localTeam = await db.getFirstAsync(
            'SELECT * FROM teams_local LIMIT 1'
        );

        console.log('je suis une local team : ' + localTeam);
        if (localTeam) {
            return {
                user_id: localTeam.user_id,
                slots: JSON.parse(localTeam.slots)
            };
        }

        return null;

    } catch (error) {
        console.error('❌ Erreur fetch team:', error);
        return null;
    }
};

const fetchCharacters = async () => {
    try {
        if (isOnline) {
            Alert.alert('Debug', '📡 Chargement depuis API...');

            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_BASE_URL}/getAllCharacters`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });
            const data = await response.json();

            Alert.alert('Debug', `✅ API: ${data.length} personnages`);

            // Sauvegarde dans la DB
            const db = await SQLite.openDatabaseAsync('genshin_nishin.db');
            await db.runAsync('DELETE FROM characters_local');

            for (const char of data) {
                await db.runAsync(
                    `INSERT INTO characters_local (id, name, type, element, weapon, rarity, image_url, updated_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [char.id, char.name, char.type, char.element, char.weapon, char.rarity, char.image_url, Date.now()]
                );
            }

            Alert.alert('Debug', '💾 Personnages sauvegardés dans la DB');
            return data;

        } else {
            Alert.alert('Debug', '📂 Chargement depuis DB locale...');

            const db = await SQLite.openDatabaseAsync('genshin_nishin.db');
            const chars = await db.getAllAsync('SELECT * FROM characters_local');

            // 🔥 CORRIGÉ : Alert avec format correct
            Alert.alert(
                'Debug DB',
                `✅ ${chars.length} personnages trouvés\n\n` +
                `Premier: ${chars[0] ? JSON.stringify(chars[0], null, 2) : 'AUCUN'}`
            );

            return chars;
        }
    } catch (error) {
        Alert.alert('❌ Erreur', error.message);

        // Fallback
        try {
            const db = await SQLite.openDatabaseAsync('genshin_nishin.db');
            const chars = await db.getAllAsync('SELECT * FROM characters_local');
            Alert.alert('🆘 Fallback', `${chars.length} personnages récupérés`);
            return chars;
        } catch (dbError) {
            Alert.alert('❌ Erreur Fallback', dbError.message);
            return [];
        }
    }
};






const fetchArtifacts = async (characterId) => {
    try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) return [];

        // 1️⃣ Si en ligne : fetch API
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

                    return artifacts;
                }
            } catch (fetchError) {
                console.warn('⚠️ Erreur fetch artifacts, basculement sur cache');
            }
        }

        // 2️⃣ Si hors ligne : charger depuis SQLite
        console.log('📂 Chargement artifacts depuis cache...');
        const db = await SQLite.openDatabaseAsync('genshin_nishin.db');
        const localArtifacts = await db.getAllAsync(
            'SELECT * FROM artifacts_local WHERE character_id = ?',
            [characterId]
        );

        return localArtifacts.map(art => ({
            slot: art.slot,
            main_stat: art.main_stat,
            stat_value: art.stat_value
        }));

    } catch (error) {
        console.error('❌ Erreur fetch artifacts:', error);
        return [];
    }
};



const logout = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');

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

//  TODO juste pour dire ça a été modifié pour la sync
const addCharacterToSlot = async (characterId, slot) => {
        try {
            await saveTeamSlot(slot, characterId);

            if (isOnline) {
                const token = await AsyncStorage.getItem('userToken');
                await fetch(`${API_BASE_URL}/addCharacterToSlot`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        'character_id': characterId,
                        'slot': slot
                    })
                });
            }

            const updatedTeam = await fetchTeam();
            setTeamData(updatedTeam);
            closeModal();
            refreshDamage();
        } catch (error) {
            console.error('Erreur addCharacterToSlot: ', error);
        }
    };

//  TODO juste pour dire ça a été modifié pour la sync
const addArtifact = async (characterId, artifactStat, slotArtifact) => {
        try {
            if (slotArtifact == "slot1") artifactStat = "HP";
            else if (slotArtifact == "slot2") artifactStat = "ATK";

            await saveArtifact(characterId, slotArtifact, artifactStat, '');

            if (isOnline) {
                const token = await AsyncStorage.getItem('userToken');
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
            fetchAndShowArtifacts();
            setArtifactsData(updatedArtifact);
            refreshDamage();
        } catch (error) {
            console.error("Erreur addArtifact:", error);
        }
    };


const removeArtifact = async (characterId, slotArtifact) => {
  try {
    console.log('🗑️ Suppression artifact:', slotArtifact);

    // 1️⃣ Supprimer localement
    await removeArtifactLocal(characterId, slotArtifact);

    // 2️⃣ Supprimer côté serveur si en ligne
    if (isOnline) {
      const token = await AsyncStorage.getItem('userToken');
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

    // 3️⃣ Recharger les artifacts
    const updatedArtifacts = await fetchArtifacts(characterId);
    setArtifactsData(updatedArtifacts);
    setArtifactModalVisible(false);
refreshDamage();
  } catch (error) {
    console.error("❌ Erreur removeArtifact:", error);
  }
};


//  TODO juste pour dire ça a été modifié pour la sync
const removeCharacter = async (characterId, slot) => {
        try {
            await removeTeamSlot(slot);

            if (isOnline) {
                const token = await AsyncStorage.getItem('userToken');
                await fetch(`${API_BASE_URL}/removeCharacterFromSlot`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        slot: slot,
                        character_id: characterId
                    })
                });
            }

            const updatedTeam = await fetchTeam();
            setTeamData(updatedTeam);
            refreshDamage();
        } catch (error) {
            console.error("Erreur dans le removeCharacter: ", error);
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
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
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
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
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


        useEffect(() => {
            Alert.alert('Debug', '🎯 Installation listener NetInfo');

            NetInfo.fetch().then(state => {
                Alert.alert('Debug', `📶 État initial: ${state.isConnected}`);
                setIsOnline(state.isConnected ?? true);
            });

            const unsubscribe = NetInfo.addEventListener(state => {
                Alert.alert('Debug', `📶 CHANGEMENT: ${state.isConnected}`);
                setIsOnline(state.isConnected ?? true);
            });

            return () => unsubscribe();
        }, []);

        useEffect(() => {
            const initialize = async () => {
                try {
                    console.log('🚀 Initialisation...');

                    await initDB();
                    console.log('✅ DB initialisée');

                    if (isOnline) {
                        const baseCharacters = await loadBaseCharacters();
                        console.log(`✅ ${baseCharacters.length} personnages synchronisés depuis API`);
                        setCharactersLocal(baseCharacters);
                    }

                    const db = await SQLite.openDatabaseAsync('genshin_nishin.db');
                    const localChars = await db.getAllAsync('SELECT * FROM characters_local');

                    setCharactersLocal(localChars);

                    const teamData = await fetchTeam();
                    setTeamData(teamData);

                    console.log('✅ Initialisation terminée');

                } catch (error) {
                    console.error('❌ Erreur initialisation:', error);
                }
            };

            initialize();
        }, []);


useEffect(() => {
    const syncOnReconnect = async () => {
        if (isOnline) {
            console.log('🌐 Connexion rétablie, synchronisation...');

            try {
                await loadBaseCharacters();

                const db = await SQLite.openDatabaseAsync('genshin_nishin.db');
                const localChars = await db.getAllAsync('SELECT * FROM characters_local');

                setCharactersLocal(localChars.map(char => ({
                    id: char.id,
                    name: char.name,
                    type: char.type,
                    vision: char.vision,
                    base_atk: char.base_atk,
                    base_hp: char.base_hp,
                    elemental_mastery: char.elemental_mastery,
                    image: char.image
                })));

                console.log('✅ Données mises à jour après reconnexion');

            } catch (error) {
                console.error('❌ Erreur sync reconnexion:', error);
            }
        }
    };

    const notOnlineTest = async () => {
        if (!isOnline) {
            const testCharacterByFetch = await fetchCharacters();
            setCharactersLocal(testCharacterByFetch);
        }

    };

    syncOnReconnect();
    notOnlineTest();
}, [isOnline]);



    const handleSlotPress = (slot, slotData) => {
        setSelectedSlot(slot);
        setSelectedSlotData(slotData);
        if (slotData == null) {
            setModalVisible(true);
        } else {
            setModalVisible(false);
            fetchAndShowArtifacts(slotData.id, slot);
        }
      };

      const closeModal = () => {
        setModalVisible(false);
        setSelectedSlot(null);
        setSelectedSlotData(null);
      };

//   SYNC encore
 const handleSync = async () => {
     try {
         setSyncStatus('🔄 Synchro...');

         // ✅ Récupérer le token
         const token = await AsyncStorage.getItem('userToken');

         if (!token) {
             setSyncStatus('❌ Non connecté');
             setTimeout(() => setSyncStatus(''), 2000);
             return;
         }

         // ✅ Passer le token à syncWithServer
         const result = await syncWithServer(token);

         setSyncStatus(result.success ? '✅ Synchronisé' : '❌ Échec');

         if (result.success) {
             // ✅ Recharger les données
             const updatedTeam = await fetchTeam();
             setTeamData(updatedTeam);
         }

         setTimeout(() => setSyncStatus(''), 2000);

     } catch (error) {
         console.error('❌ Erreur handleSync:', error);
         setSyncStatus('❌ Erreur');
         setTimeout(() => setSyncStatus(''), 2000);
     }
 };


    const handleLongPress = (characterId, slot, teamData) => {
        console.log('tu es dans lautre handlelongpress');
        removeCharacter(characterId, slot, teamData);
    };

    const handleAddArtifact = (slotArtifact) => {
        setSelectedSlotForPicker(slotArtifact);
        setArtifactModalVisible(true);
        setSelectedStat('');
    };

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
                      {isOnline && syncStatus}
                    </Text>
                  </View>

        <Pressable onPress={() => logout()}><Text>Déconnexion</Text></Pressable>

        <Text style={styles.title}>Nishin</Text>

        <View style={{ marginHorizontal: 15}}>
        <Text style={styles.sectionLabel}>Équipe</Text>
        <View style={styles.teamRow}>
            <SlotCard character={teamData?.slots?.slot1} slot='slot1' onSlotPress={handleSlotPress} characterImages={characterImages} onLongPress={handleLongPress}/>
            <SlotCard character={teamData?.slots?.slot2} slot='slot2' onSlotPress={handleSlotPress} characterImages={characterImages} onLongPress={handleLongPress}/>
            <SlotCard character={teamData?.slots?.slot3} slot='slot3' onSlotPress={handleSlotPress} characterImages={characterImages} onLongPress={handleLongPress}/>
            <SlotCard character={teamData?.slots?.slot4} slot='slot4' onSlotPress={handleSlotPress} characterImages={characterImages} onLongPress={handleLongPress}/>
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
                                <Pressable onPress={() => addCharacterToSlot(item.id, selectedSlot)}>
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
                        style={[styles.button, styles.cancelButton]}
                        onPress={() => setArtifactModalVisible(false)}
                    >
                        <Text style={{ color: '#d66', fontWeight: '600'}}>Annuler</Text>
                    </Pressable>
                    <Pressable
                        style={[styles.button, styles.confirmButton]}
                        onPress={() => addArtifact(selectedSlotData.id, selectedStat, selectedSlotForPicker)}
                    >
                        <Text style={{ color: '#fff', fontWeight: '600'}}>Ajouter</Text>
                    </Pressable>
                    <Pressable
                        style={[styles.button, styles.deleteButton]}
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


{/* 🆕 Bouton de synchro manuelle */}
            <TouchableOpacity
              style={[styles.syncButton, !isOnline && styles.syncButtonDisabled]}
              onPress={handleSync}
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

function SlotCard({character, slot, onSlotPress, onLongPress, characterImages, teamData}) {
  const handlePress = () => {
      if (onSlotPress) {
        onSlotPress(slot, character);
      }
    };
  const handleLong = () => {
    if (onLongPress) {
        onLongPress(character.id, slot, teamData);
    }
  }
  return (
    <TouchableOpacity style={styles.slotCard} onPress={handlePress} onLongPress={handleLong}>
          <Image
                  source={characterImages[character?.name.toLowerCase()] || characterImages.plus}
                  style={styles.characterImageInSlot}
                />
          <Text style={styles.slot}>{character?.name ?? ''}</Text>
                <Text style={styles.role}>{character?.type}</Text>
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