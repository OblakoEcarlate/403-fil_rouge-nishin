import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';


export function Accordion({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
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

const styles = StyleSheet.create({
    accordionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    sectionLabel: { fontSize: 16, fontWeight: '600', marginTop: 12 },
    chevron: { fontSize: 16 },
    accordionBody: { backgroundColor: '#eee', borderRadius: 8, padding: 12, marginTop: 8 },
});