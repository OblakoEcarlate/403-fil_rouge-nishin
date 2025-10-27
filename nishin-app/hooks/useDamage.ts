import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import React, { useState, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';


const API_BASE_URL = Constants.expoConfig.extra.API_BASE_URL;
const API_KEY = Constants.expoConfig.extra.API_KEY;

export function useDamage() {


    const getBasicDamage = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');  

            const response = await fetch(`${API_BASE_URL}/simulateBasicDamageForDPS`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    },
                });

            const basicDamage = await response.json();
            return basicDamage;
        } catch (error) {
            console.error('Erreur basic damage: ', error);
        }
    };

    async function getArtifactDamage() {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_BASE_URL}/simulateDamageWithArtifact`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    },
                });

            const artifactDamage = await response.json();
            return artifactDamage;
        } catch (error) {
            console.error('Erreur calculs artefacts: ', error);
        }
    };

    async function getDamage() {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await fetch(`${API_BASE_URL}/simulateDamageForDPS`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                    },
                });

            const damage = await response.json();
            return damage;
        } catch (error) {
            console.error('Erreur calculs damage: ', error);
        }
    };

    return { getBasicDamage, getArtifactDamage, getDamage };
}