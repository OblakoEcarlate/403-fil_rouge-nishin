import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, FlatList, Pressable, Modal, ActivityIndicator, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, AppState } from 'react-native';
import Constants from 'expo-constants';
import {Picker} from '@react-native-picker/picker';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = Constants.expoConfig.extra.API_BASE_URL;
const API_KEY = Constants.expoConfig.extra.API_KEY;

const fetchTeam = async () => {
    try {
        const token = await AsyncStorage.getItem('userToken');

        const response = await fetch(`${API_BASE_URL}/getTeam`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
                },
           });
       const data = await response.json();
       return data;
    } catch (error) {
        console.error('Erreur fetch team: ', error);
        }
    };

const fetchCharacters = async () => {
    try {
        const token = await AsyncStorage.getItem('userToken');

        const response = await fetch(`${API_BASE_URL}/getAllCharacters`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
                },
            });
        const characters = await response.json();
        return characters;
    } catch (error) {
        console.error('Erreur fetch characters: ', error);
    }
};

const fetchArtifacts = async (characterId) => {
    try {
        const token = await AsyncStorage.getItem('userToken');

        const response = await fetch(`${API_BASE_URL}/getArtifactStat?character_id=${characterId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const artifacts = await response.json();
        return artifacts;
    } catch (error) {
        console.error('Erreur fetch des artefacts: ', error);
        return [];
    }
}


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

async function logout() {
        try {
            const token = await AsyncStorage.getItem('userToken');

            const response = await fetch(`${API_BASE_URL}/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                    },
            });

            router.replace('/auth');
        } catch (error) {
            console.error('Erreur déconnexion: ', error);
        }
    };

const addCharacterToSlot = async (characterId, slot) => {
    try {
        const token = await AsyncStorage.getItem('userToken');

        const response = await fetch(`${API_BASE_URL}/addCharacterToSlot`, {
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

        const result = await response.json();
        const updatedTeam = await fetchTeam();
        setTeamData(updatedTeam);
        closeModal();
    } catch (error) {
        console.error('Erreur addCharacterToSlot: ', error);
    }
}

const addArtifact = async (characterId, artifactStat, slotArtifact) => {
    try {
        if (slotArtifact == "slot1") {
            artifactStat = "HP";
        } else if (slotArtifact == "slot2") {
            artifactStat = "ATK";
        }

        const token = await AsyncStorage.getItem('userToken');

        const response = await fetch(`${API_BASE_URL}/addArtifact`, {
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

        const result = await response.json();
        const updatedArtifact = await fetchArtifacts(characterId);

        setArtifactModalVisible(false);
        fetchAndShowArtifacts();
        setArtifactsData(updatedArtifact);
    } catch (error) {
        console.error("Erreur addArtifact:", error);
    }
};

const removeArtifact = async (characterId, slotArtifact) => {
    try {
        const token = await AsyncStorage.getItem('userToken');

        const response = await fetch(`${API_BASE_URL}/removeArtifact`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                slot: slotArtifact,
                character_id: characterId
            })
        });

        const result = await response.json();
        const updatedArtifact = await fetchArtifacts(characterId);

        setArtifactModalVisible(false);
        fetchAndShowArtifacts();
        setArtifactsData(updatedArtifact);
    } catch (error) {
        console.error("Erreur removeArtifact :", error);
    }
};

const removeCharacter = async (characterId, slot) => {
    try {
        const token = await AsyncStorage.getItem('userToken');

        const response = await fetch(`${API_BASE_URL}/removeCharacterFromSlot`, {
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

        const result = await response.json();
        const updatedTeam = await fetchTeam();

        setTeamData(updatedTeam);
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

            console.log(response);
            const damage = await response.json();
            console.log(damage);
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
            const loadTeamData = async () => {
                try {
                    const data = await fetchTeam();
                    setTeamData(data);
                } catch (err) {
                    setError(err.message);
                }
            };

            const loadCharactersData = async () => {
                try {
                    const characters = await fetchCharacters();
                    setCharactersData(characters);
                } catch (err) {
                    setError(err.message);
                }
            };

            loadTeamData();
            loadCharactersData();
        }, []);

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
        <Pressable onPress={() => logout()}><Text>Déconnexion</Text></Pressable>

        <Text style={styles.title}>Nishin</Text>

        <View style={{ marginHorizontal: 15}}>
        <Text style={styles.sectionLabel}>Équipe</Text>
        <View style={styles.teamRow}>
            <SlotCard data={teamData?.slots?.slot1} slot='slot1' onSlotPress={handleSlotPress} characterImages={characterImages} onLongPress={handleLongPress}/>
            <SlotCard data={teamData?.slots?.slot2} slot='slot2' onSlotPress={handleSlotPress} characterImages={characterImages} onLongPress={handleLongPress}/>
            <SlotCard data={teamData?.slots?.slot3} slot='slot3' onSlotPress={handleSlotPress} characterImages={characterImages} onLongPress={handleLongPress}/>
            <SlotCard data={teamData?.slots?.slot4} slot='slot4' onSlotPress={handleSlotPress} characterImages={characterImages} onLongPress={handleLongPress}/>
        </View>

        <Modal style={styles.modalCharacters} animationType="slide" visible={modalVisible} onRequestClose={closeModal}>
            <View>
                <Pressable onPress={closeModal}><Text>x</Text></Pressable>
                <Text style={styles.modalTitle}>Choisir un personnage</Text>
                <View style={styles.containerModal}>
                <FlatList
                    vertical
                    data={charactersData}
                    contentContainerStyle={styles.listContainer}
                    renderItem={({item, index}) => (
                        <View style={styles.containerImage}>
                        <Pressable onPress={() => addCharacterToSlot(item.id, selectedSlot)}>
                            <Image
                                source={characterImages[item.name.toLowerCase()]}
                                style={styles.characterImage}
                            />
                            <Text source={item} key={index}>{item.name}</Text>
                        </Pressable>

                        </View>
                    )}
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

function SlotCard({data, slot, onSlotPress, onLongPress, characterImages, teamData}) {
  const handlePress = () => {
      if (onSlotPress) {
        onSlotPress(slot, data);
      }
    };
  const handleLong = () => {
    if (onLongPress) {
        onLongPress(data.id, slot, teamData);
    }
  }
  return (
    <TouchableOpacity style={styles.slotCard} onPress={handlePress} onLongPress={handleLong}>
      <Image
        source={characterImages[data?.name.toLowerCase()] || characterImages.plus}
        style={styles.characterImageInSlot}
      />
      <Text style={styles.slot}>{data?.name ?? ''}</Text>
      <Text style={styles.role}>{data?.type}</Text>
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
  deleteButton: { backgroundColor: '#000', borderRadius: 8, padding: 10, width: 120, alignItems: 'center', justifyContent: 'center' }
});