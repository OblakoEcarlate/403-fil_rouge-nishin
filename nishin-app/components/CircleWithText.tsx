import { View, Text, StyleSheet } from 'react-native';


export function CircleWithText({ text }: { text: string }) {
  return (
    <View style={styles.circle}>
      <Text style={styles.circleText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
    circle: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: '#000', alignItems: 'center', justifyContent: 'center' },
    circleText: { fontSize: 18, fontWeight: '700' },
});