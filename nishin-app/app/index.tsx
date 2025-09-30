import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, Modal, ActivityIndicator, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig.extra.API_BASE_URL;
const API_KEY = Constants.expoConfig.extra.API_KEY;


const fetchTeam = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/getTeam?team_id=68dba59e213bfb469101ae92`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': API_KEY
                },
           });
       const data = await response.json();
       return data;
    } catch (error) {
        console.error('Erreur fetch: ', error);
        }
    };

const fetchCharacters = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/getAllCharacters`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': API_KEY
                },
            });
        const characters = await response.json();
        return characters;
    } catch (error) {
        console.error('Erreur fetch: ', error);
    }
};

// const addCharacterToSlot = async () => {
//     const response = await fetch(`${API_BASE_URL}/addCharacterToSlot?team_id=68cbb498fd7c1749b8048502`, {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': API_KEY
//                     },
//            body: {
//                'character_id': 1,
//                'slot': 'slot1'
//                });
//     }

function SlotCard({data, slot, onSlotPress}) {
  const handlePress = () => {
      if (onSlotPress) {
        onSlotPress(slot, data);
      }
    };
  return (
    <TouchableOpacity style={styles.slotCard} onPress={handlePress}>
      <Text style={styles.plusBig}>+</Text>
      <Text style={styles.slot}>{data?.name ?? ''}</Text>
      <Text style={styles.role}>{data?.type}</Text>
    </TouchableOpacity>
  );
}

export default function NishinScreen() {
    const [teamData, setTeamData] = useState(null);
    const [error, setError] = useState(null);
    const [charactersData, setCharactersData] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [selectedSlotData, setSelectedSlotData] = useState(null);

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
        console.log(`Slot ${slot} cliqué:`, slotData);
        setSelectedSlot(slot);
        setSelectedSlotData(slotData);
        if (slotData == null) {
            setModalVisible(true);
        } else {
            setModalVisible(false);
        }
      };

      const closeModal = () => {
        setModalVisible(false);
        setSelectedSlot(null);
        setSelectedSlotData(null);
      };
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView>

        <Text style={styles.title}>Nishin</Text>

        <Text style={styles.sectionLabel}>Équipe</Text>
        <View style={styles.teamRow}>
            <SlotCard data={teamData?.slots?.slot1} slot='slot1' onSlotPress={handleSlotPress}/>
            <SlotCard data={teamData?.slots?.slot2} slot='slot2' onSlotPress={handleSlotPress}/>
            <SlotCard data={teamData?.slots?.slot3} slot='slot3' onSlotPress={handleSlotPress}/>
            <SlotCard data={teamData?.slots?.slot4} slot='slot4' onSlotPress={handleSlotPress}/>
        </View>

        <Modal style={styles.modalCharacters} animationType="slide" visible={modalVisible} onRequestClose={closeModal}>
            <View>
                <Pressable onPress={closeModal}><Text>x</Text></Pressable>
                <Text>je suis un texte dans une modal</Text>
                <FlatList
                    vertical
                    data={charactersData}
                    contentContainerStyle={styles.listContainer}
                    renderItem={({item, index}) => (
                        <Text source={item} key={index}>{item.name}</Text>
                    )}
                />
            </View>
        </Modal>

        <Accordion title="Artéfacts">
          <Text style={styles.infoText}>Contenu à venir…</Text>
        </Accordion>

        <Accordion title="Réaction élémentaire" defaultOpen>
          <View style={styles.reactionBox}>
            <CircleWithText text={'?'} />
            <Text style={styles.plus}> + </Text>
            <CircleWithText text={'?'} />
          </View>
          <Text style={styles.muted}>Compose ton équipe pour connaître la réaction</Text>
        </Accordion>

        <Text style={styles.sectionLabel}>Dégâts estimés avec Nom</Text>
        <View style={styles.damageBox}>
          <Text style={styles.damageText}>Compose ton équipe pour connaître les dégâts de ton DPS</Text>
        </View>



        <View style={{ height: 40 }} />
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
  damageBox: { borderWidth: 1, borderColor: '#d66', borderRadius: 8, padding: 12, marginTop: 8 },
  damageText: { color: '#333' },
  error: { color: '#b00020', marginTop: 8 },
  reloadBtn: { alignSelf: 'center', marginTop: 12, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#111', borderRadius: 8 },
  reloadText: { color: '#fff', fontWeight: '600' },
  chevron: { fontSize: 16 },
});