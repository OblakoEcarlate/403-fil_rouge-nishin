import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen style={styles.title} name="index" options={{ title: 'Nishin' }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});