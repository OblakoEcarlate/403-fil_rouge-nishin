import NetInfo from '@react-native-community/netinfo';
import Constants from 'expo-constants';
import * as SQLite from 'expo-sqlite';

const API_URL = Constants.expoConfig.extra.API_BASE_URL;

export const syncWithServer = async (token) => {
  try {
    console.log('🔄 Début synchro...');

    if (!token) {
      throw new Error('Token manquant');
    }

    const db = await SQLite.openDatabaseAsync('genshin_nishin.db');

    // 1️⃣ PUSH : Envoyer les données locales modifiées
    const localTeam = await db.getFirstAsync(
      'SELECT * FROM teams_local WHERE dirty = 1 LIMIT 1'
    );

    if (localTeam) {
      console.log('📤 Envoi team locale:', localTeam);

      const pushResponse = await fetch(`${API_URL}/sync/push`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          slots: JSON.parse(localTeam.slots)
        })
      });

      // ✅ VÉRIFIER le Content-Type AVANT de parser
      const contentType = pushResponse.headers.get('content-type');

      if (!pushResponse.ok) {
        const errorText = await pushResponse.text();
        console.error('❌ Erreur serveur:', errorText.substring(0, 200));
        throw new Error(`Erreur serveur: ${pushResponse.status}`);
      }

      if (contentType && contentType.includes('application/json')) {
        const result = await pushResponse.json();
        console.log('✅ Push réussi:', result);
      } else {
        console.warn('⚠️ Réponse non-JSON:', await pushResponse.text());
      }

      // Marquer comme propre seulement si succès
      await db.runAsync(
        'UPDATE teams_local SET dirty = 0 WHERE id = ?',
        [localTeam.id]
      );
    }

    // 2️⃣ PULL : Récupérer les données distantes
    console.log('📥 Récupération team distante...');

    const pullResponse = await fetch(`${API_URL}/sync/full`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const pullContentType = pullResponse.headers.get('content-type');

    if (!pullResponse.ok) {
      const errorText = await pullResponse.text();
      console.error('❌ Erreur PULL:', errorText.substring(0, 200));
      throw new Error(`Erreur PULL: ${pullResponse.status}`);
    }

    if (!pullContentType || !pullContentType.includes('application/json')) {
      const text = await pullResponse.text();
      console.error('❌ Réponse non-JSON:', text.substring(0, 200));
      throw new Error('Le serveur n\'a pas renvoyé du JSON');
    }

    const remoteTeam = await pullResponse.json();
    console.log('✅ Team distante reçue:', remoteTeam);

    // Sauvegarder dans la DB locale
    const slotsJson = JSON.stringify(remoteTeam.slots || {
      slot1: null,
      slot2: null,
      slot3: null,
      slot4: null
    });

    await db.runAsync(
      `INSERT OR REPLACE INTO teams_local (id, user_id, slots, updated_at, dirty)
       VALUES (?, ?, ?, ?, 0)`,
      ['main_team', remoteTeam.user_id || 'unknown', slotsJson, Math.floor(Date.now() / 1000)]
    );

    setLastSync(new Date().toISOString());

    console.log('✅ Synchro terminée');
    return { success: true };

  } catch (error) {
    console.error('❌ Erreur syncWithServer:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

// Helper
const setLastSync = async (timestamp) => {
  const db = await SQLite.openDatabaseAsync('genshin_nishin.db');
  await db.runAsync(
    'INSERT OR REPLACE INTO sync_meta (key, value) VALUES (?, ?)',
    ['last_sync', timestamp]
  );
};
