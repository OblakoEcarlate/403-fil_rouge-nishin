import { View, Text, StyleSheet, Image, TouchableOpacity, Pressable } from 'react-native';

export function ArtifactCard({ slot, artifactData, artifactImages, onAddArtifact }) {
    const artifactImage = artifactImages[slot] || require('../assets/icone/plus.png');

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
                                source={require('../assets/icone/plus.png')}
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
    artifactCard: { flexDirection: 'row', gap: 12, marginTop: 2, alignItems: 'center', justifyContent: 'center'},
    artifactRow: { flexDirection: 'row', gap: 12, marginTop: 2, alignItems: 'center', justifyContent: 'center'},
    artifactImage: { height: 60, width: 60 },
    artifactText: { textAlign: 'center' },
});