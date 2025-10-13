import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

const isLoggedIn = false;

export default function RootLayout() {
  return (
    <Stack>
          <Stack.Protected guard={!isLoggedIn}>
            <Stack.Screen name="auth" />
          </Stack.Protected>

          <Stack.Protected guard={isLoggedIn}>
            <Stack.Screen name="private" />
          </Stack.Protected>
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