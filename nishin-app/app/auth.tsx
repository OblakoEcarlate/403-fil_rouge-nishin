import { router } from 'expo-router';
import { View, Text, Button, StyleSheet, TextInput, Pressable } from 'react-native';
import React, { useState } from 'react';

export default function AuthPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const goHome = () => {
    router.replace('/');
  };

  return (
    <View style={styles.mainContainer}>
      <Text style={styles.title}>Nishin</Text>

      <View style={styles.containerInput}>
          <Text>Nom d'utilisateur</Text>
          <TextInput
            style={styles.inputForm}
            value={username}
            autoComplete={username}
          />
      </View>

      <View style={styles.containerInput}>
          <Text>Mot de passe</Text>
          <TextInput
            style={styles.inputForm}
            value={password}
          />
          <Text style={styles.littleText}>Doit contenir un caractère spécial</Text>
      </View>

      <Pressable title="Accueil" style={styles.loginButton} onPress={goHome}><Text style={styles.textButtonLogin}>Accueil</Text></Pressable>

      <Text style={styles.littleTextAuth}>Pas encore de compte ?</Text>
      <Pressable title="Accueil" style={styles.authButton} onPress={goHome}><Text style={styles.textButtonAuth}>Inscription</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
    mainContainer: { justifyContent: 'center', alignItems: 'center', flexDirection: 'col', marginVertical: 250 },
    title: { fontSize: 35, marginVertical: 20 },
    containerInput: { marginVertical: 10 },
    inputForm: { backgroundColor: '#ddd', width: 250, height: 30, borderRadius: 50 },
    littleText: { fontWeight: '300', color: '#636363'},
    authButton: { borderColor: '#d66', borderWidth: 2, borderRadius: 50, padding: 10, alignItems: 'center', justifyContent: 'center', width: 200},
    loginButton: { backgroundColor: '#d66', borderRadius: 50, padding: 10, width: 200, alignItems: 'center', justifyContent: 'center', marginTop: 40},
    textButtonLogin: { color: '#fff', fontSize: 15, fontWeight: '800'},
    textButtonAuth: { color: '#d66', fontSize: 15, fontWeight: '800'},
    littleTextAuth: { fontWeight: '300', color: '#636363', marginTop: 20},
});