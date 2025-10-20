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
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  const goHome = () => {
    router.replace('/');
  };

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setIsLoading(true);

    try {
      const url = isRegisterMode ? `${API_BASE_URL}/register` : `${API_BASE_URL}/login`;
      const body = isRegisterMode
        ? JSON.stringify({
            email: email,
            password: password,
            password_confirmation: password,
            device_name: "React Native App"
          })
        : JSON.stringify({
            email: email,
            password: password,
            device_name: "React Native App"
          });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': API_KEY
        },
        body: body
      });

      const result = await response.json();

      if (response.ok) {
        const token = result.token || result.access_token || result.data?.token;
        const user = result.user || result.data?.user || result;

        if (token) {
          await AsyncStorage.setItem('userToken', token);
          await AsyncStorage.setItem('userData', JSON.stringify(user));

          Alert.alert('Succès', isRegisterMode ? 'Inscription réussie !' : 'Connexion réussie !');
          router.replace('/(tabs)');
        } else {
          Alert.alert('Erreur', 'Token non reçu');
        }
      } else {
        const errorMessage = result.message || result.error || 'Erreur lors de l\'authentification';

        if (result.errors) {
          const validationErrors = Object.values(result.errors).flat().join('\n');
          Alert.alert('Erreur', validationErrors);
        } else {
          Alert.alert('Erreur', errorMessage);
        }
      }
    } catch (error) {
      console.error("Erreur:", error);
      Alert.alert('Erreur', 'Impossible de se connecter au serveur');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsRegisterMode(!isRegisterMode);
  };

  return (
    <View style={styles.mainContainer}>
      <Text style={styles.title}>Nishin</Text>
      <Text style={styles.subtitle}>
        {isRegisterMode ? 'Créer un compte' : 'Se connecter'}
      </Text>

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
        <Text style={styles.littleText}>
          {isRegisterMode ? 'Doit contenir un caractère spécial' : ''}
        </Text>
      </View>

      {isRegisterMode && (
        <View style={styles.containerInput}>
          <Text style={styles.label}>Confirmer le mot de passe</Text>
          <TextInput
            style={styles.inputForm}
            secureTextEntry
          />
        </View>
      )}

      <Pressable
        style={[styles.authButton, isLoading && styles.disabledButton]}
        onPress={handleAuth}
        disabled={isLoading}
      >
        <Text style={styles.textButtonAuth}>
          {isLoading
            ? (isRegisterMode ? 'Inscription...' : 'Connexion...')
            : (isRegisterMode ? 'S\'inscrire' : 'Se connecter')
          }
        </Text>
      </Pressable>

      <Text style={styles.littleTextAuth}>
        {isRegisterMode ? 'Déjà un compte ?' : 'Pas encore de compte ?'}
      </Text>

      <Pressable
        style={styles.switchModeButton}
        onPress={toggleAuthMode}
        disabled={isLoading}
      >
        <Text style={styles.textButtonSwitch}>
          {isRegisterMode ? 'Se connecter' : 'S\'inscrire'}
        </Text>
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
    marginVertical: 10,
    fontWeight: 'bold',
    color: '#d66'
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 20,
    color: '#666'
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
    backgroundColor: '#d66',
    borderRadius: 25,
    padding: 12,
    width: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30
  },
  switchModeButton: {
    borderColor: '#d66',
    borderWidth: 2,
    borderRadius: 25,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: 200,
    marginTop: 10
  },
  disabledButton: {
    backgroundColor: '#ccc',
    borderColor: '#ccc'
  },
  textButtonAuth: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800'
  },
  textButtonSwitch: {
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
