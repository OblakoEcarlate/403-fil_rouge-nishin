import React, { useCallback, useEffect, useState } from 'react';
import { Image, FlatList, Pressable, Modal, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import {Picker} from '@react-native-picker/picker';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { useSync } from '../../hooks/useSync';
import { useTeam } from '../../hooks/useTeam';
import { useArtifacts } from '../../hooks/useArtifacts';
import { useDamage } from '../../hooks/useDamage';
import { useAuth } from '../../hooks/useAuth';

import { Accordion } from '../../components/Accordion';
import { CircleWithText } from '../../components/CircleWithText';
import { SlotCard } from '../../components/SlotCard';
import { ArtifactCard } from '../../components/ArtifactCard';
import { artifactImages, characterImages } from '../../assets';


export default function NishinScreen() {
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [selectedSlotData, setSelectedSlotData] = useState(null);
    const [selectedSlotForArtifacts, setSelectedSlotForArtifacts] = useState(null);
    const [artifactModalVisible, setArtifactModalVisible] = useState(false);
    const [selectedSlotForPicker, setSelectedSlotForPicker] = useState(null);
    const [selectedStat, setSelectedStat] = useState('');
    const [basicDamage, setBasicDamage] = useState(null);
    const [artifactDamage, setArtifactDamage] = useState(null);
    const [damage, setDamage] = useState(null);

    const {initializeLocalData, fetchLocalTeamData, teamData, charactersLocal, addCharacterToSlot, removeCharacter, isComplete, checkTeamComplete } = useTeam();
    const { artifacts, addArtifact, fetchAndShowArtifacts, removeArtifact } = useArtifacts();
    const { getBasicDamage, getArtifactDamage, getDamage } = useDamage();
    const { logout } = useAuth();


// TEST USESYNC --------------------------------------------------------------------------------------------
  const onSyncComplete = useCallback(async () => {
    await initializeLocalData();

    await fetchLocalTeamData(); 
  }, [fetchLocalTeamData]);

const { isOnline } = useSync(onSyncComplete);

// DAMAGE -------------------------------------------------------------------------------
    useEffect(() => {
      (async () => {
        await checkTeamComplete(teamData);
        if (isComplete) {
          const base = await getBasicDamage();
          const artifact = await getArtifactDamage();
          const total = await getDamage();

          setBasicDamage(base);
          setArtifactDamage(artifact);
          setDamage(total);
        } else {
          setBasicDamage(null);
          setArtifactDamage(null);
          setDamage(null);
        }
      })();
    }, [isComplete, getBasicDamage, getArtifactDamage, getDamage]);


// UI -> les onPress
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


    const handleLongPress = (characterId, slot) => {
        removeCharacter(characterId, slot);
    };

    const handleAddArtifact = (slotArtifact) => {
        setSelectedSlotForPicker(slotArtifact);
        setArtifactModalVisible(true);
        setSelectedStat('');
    };

    const handleViewArtifacts = async (characterId, slot) => {
      try {
        await fetchAndShowArtifacts(characterId);
        setSelectedSlotForArtifacts(slot);
      } catch (error) {
        console.error('Erreur affichage artéfacts:', error);
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
                                <Pressable onPress={() => {
                                    addCharacterToSlot(item.id.toString(), selectedSlot);
                                    closeModal();
                                  }}>
                                    <Image
                                        source={characterImages[item.name?.toLowerCase()]}
                                        style={styles.characterImage}
                                    />
                                    <Text>{item.name}</Text>
                                </Pressable>
                            </View>
                        )}
                    />
                </View>
            </View>
        </Modal>

        <Accordion title="Artéfacts">
          <View style={styles.artifactRow}>
            {artifacts && Object.entries(artifacts).map(([slot, artifacts]) => (
              <ArtifactCard
                key={slot}
                slot={slot}
                artifactData={artifacts}
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
                        onPress={() => {
                          addArtifact(selectedSlotData.id, selectedStat, selectedSlotForPicker);
                          setArtifactModalVisible(false);
                        }}
                    >
                        <Text style={{ color: '#fff', fontWeight: '600'}}>Ajouter</Text>
                    </Pressable>
                    <Pressable
                        style={[styles.deleteButton]}
                        onPress={() => {
                          removeArtifact(selectedSlotData.id, selectedSlotForPicker); 
                          setArtifactModalVisible(false);}}
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

            <View>
              <Text>{isOnline ? '🟢 En ligne' : '🔴 Hors ligne'}</Text>
            </View>

        <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 16 },
  title: { fontSize: 32, fontWeight: '600', textAlign: 'center', marginVertical: 8 },
  sectionLabel: { fontSize: 16, fontWeight: '600', marginTop: 12 },
  teamRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  artifactRow: { flexDirection: 'row', gap: 12, marginTop: 2, alignItems: 'center', justifyContent: 'center'},
  plusBig: { fontSize: 28, color: '#333' },
  reactionBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  plus: { fontSize: 22, marginHorizontal: 8 },
  muted: { marginTop: 8, color: '#666' },
  damageBox: { borderWidth: 3, borderColor: '#d66', borderRadius: 8, padding: 12, marginTop: 8 },
  damageText: { color: '#333' },
  error: { color: '#b00020', marginTop: 8 },
  reloadBtn: { alignSelf: 'center', marginTop: 12, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#111', borderRadius: 8 },
  reloadText: { color: '#fff', fontWeight: '600' },
  modalCharacters: { marginHorizontal: 20, marginVertical: 30},
  characterImage: { height: 100, width: 100},
  containerImage: { flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' },
  containerModal: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center'},
  listContainer: { marginHorizontal: 15, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between'},
  titleModalCharacter: { marginVertical: 30, fontSize: 26, fontWeight: '600', textAlign: 'center' },
  close: { fontSize: 30 },
  modalContainer: { marginVertical: 50, marginHorizontal: 10 },
  modalTitle: { textAlign: 'center', fontWeight: '600', fontSize: 20, marginVertical: 20},
  fixedStatText: {textAlign: 'center', fontSize: 10 },
  modalButtons: {flexDirection: 'row', gap: 20, marginVertical: 200, alignItems: 'center', justifyContent: 'center'},
  cancelButton: { borderColor: '#d66', borderWidth: 2, borderRadius: 8, padding: 10, alignItems: 'center', justifyContent: 'center', width: 120 },
  confirmButton: { backgroundColor: '#d66', borderRadius: 8, padding: 10, width: 120, alignItems: 'center', justifyContent: 'center'},
  deleteButton: { backgroundColor: '#000', borderRadius: 8, padding: 10, width: 120, alignItems: 'center', justifyContent: 'center' },
});