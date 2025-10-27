import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';


export function SlotCard({charactersLocal, slot, onSlotPress, onLongPress, characterImages, teamData}) {
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
                  source={characterImages[charactersLocal?.name.toLowerCase()] || require('../assets/icone/plus.png')}
                  style={styles.characterImageInSlot}
                />
          <Text style={styles.slot}>{charactersLocal?.name ?? ''}</Text>
                <Text style={styles.role}>{charactersLocal?.type}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
    slotCard: {
    flex: 1,
    backgroundColor: '#eee',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  characterImageInSlot: { height: 60, width: 60 },
  slotName: { marginTop: 4, fontSize: 14, fontWeight: '600' },
  role: { marginTop: 2, fontSize: 12, color: '#666' },
});