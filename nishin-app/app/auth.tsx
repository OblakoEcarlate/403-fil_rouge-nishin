import { router } from 'expo-router';
import { View, Text, StyleSheet, TextInput, Pressable, Alert } from 'react-native';
import React, { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig.extra.API_BASE_URL;
const API_KEY = Constants.expoConfig.extra.API_KEY;

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const goHome = () => {
    router.replace('/');
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': API_KEY
        },
        body: JSON.stringify({
          email: email,
          password: password,
          device_name: "React Native App"
        })
      });

      const result = await response.json();

      const token = result.token || result.access_token || result.data?.token;
      const user = result.user || result.data?.user || result;

      if (response.ok) {
        await AsyncStorage.setItem('userToken', result.token);
        await AsyncStorage.setItem('userData', JSON.stringify(result.user));

        Alert.alert('Succès', 'Connexion réussie !');
        router.replace('/');
      } else {
        Alert.alert('Erreur', result.message || 'Erreur de connexion');
      }
    } catch (error) {
      console.error("Erreur:", error);
      Alert.alert('Erreur', 'Impossible de se connecter au serveur');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = () => {
    router.push('/');
  };

  return (
    <View style={styles.mainContainer}>
      <Text style={styles.title}>Nishin</Text>

      <View style={styles.containerInput}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.inputForm}
          value={email}
          onChangeText={setEmail}
          autoComplete="email"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.containerInput}>
        <Text style={styles.label}>Mot de passe</Text>
        <TextInput
          style={styles.inputForm}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <Text style={styles.littleText}>Doit contenir un caractère spécial</Text>
      </View>

      <Pressable
        style={[styles.loginButton, isLoading && styles.disabledButton]}
        onPress={handleLogin}
        disabled={isLoading}
      >
        <Text style={styles.textButtonLogin}>
          {isLoading ? 'Connexion...' : 'Se connecter'}
        </Text>
      </Pressable>

      <Text style={styles.littleTextAuth}>Pas encore de compte ?</Text>

      <Pressable
        style={styles.authButton}
        onPress={handleRegister}
        disabled={isLoading}
      >
        <Text style={styles.textButtonAuth}>S'inscrire</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    padding: 20,
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 35,
    marginVertical: 20,
    fontWeight: 'bold',
    color: '#d66'
  },
  containerInput: {
    marginVertical: 10,
    width: '100%',
    maxWidth: 300
  },
  label: {
    marginBottom: 5,
    fontWeight: '600',
    color: '#333'
  },
  inputForm: {
    backgroundColor: '#f5f5f5',
    width: '100%',
    height: 45,
    borderRadius: 25,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  littleText: {
    fontWeight: '300',
    color: '#636363',
    fontSize: 12,
    marginTop: 5
  },
  authButton: {
    borderColor: '#d66',
    borderWidth: 2,
    borderRadius: 25,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: 200,
    marginTop: 10
  },
  loginButton: {
    backgroundColor: '#d66',
    borderRadius: 25,
    padding: 12,
    width: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30
  },
  disabledButton: {
    backgroundColor: '#ccc'
  },
  textButtonLogin: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800'
  },
  textButtonAuth: {
    color: '#d66',
    fontSize: 16,
    fontWeight: '800'
  },
  littleTextAuth: {
    fontWeight: '300',
    color: '#636363',
    marginTop: 20,
    fontSize: 14
  },
});
