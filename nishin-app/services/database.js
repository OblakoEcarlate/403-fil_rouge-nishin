import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig.extra.API_BASE_URL;

let db = null;

export const getDB = () => {
  if (!db) {
    throw new Error('❌ DB non initialisée ! Appelle initDB() d\'abord.');
  }
  return db;
};


// 🎬 Initialiser les tables
export const initDB = async () => {
  try {
    console.log('📂 Ouverture de la base de données...');
    db = await SQLite.openDatabaseAsync('genshin_nishin.db');
    // Ouvrir la DB
    if (!db) {
          db = await SQLite.openDatabaseAsync('genshin_nishin.db');
          console.log('✅ Base ouverte');
        }

    console.log('✅ Base ouverte');

        await db.execAsync(`
          DROP TABLE IF EXISTS teams_local;
          DROP TABLE IF EXISTS sync_meta;
          DROP TABLE IF EXISTS characters_local;
        `);
        console.log('🗑️ Tables nettoyées');
    // Créer les tables
    await db.execAsync(`
      -- Table pour stocker l'équipe locale
      CREATE TABLE IF NOT EXISTS teams_local (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        slots TEXT DEFAULT '{"slot1":null,"slot2":null,"slot3":null,"slot4":null}',
        updated_at INTEGER DEFAULT (strftime('%s', 'now')),
        dirty INTEGER DEFAULT 0
      );

      -- Table pour les métadonnées de synchro
      CREATE TABLE IF NOT EXISTS sync_meta (
        key TEXT PRIMARY KEY,
        value TEXT
      );

      -- Table pour stocker TOUS les personnages (optionnel)
      CREATE TABLE IF NOT EXISTS characters_local (
        id TEXT PRIMARY KEY,
        name TEXT,
        type TEXT,
        image TEXT,
        base_atk INTEGER,
        elemental_mastery INTEGER,
        base_hp INTEGER,
        vision TEXT,
        slot INTEGER DEFAULT 0,
        data TEXT,
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      );

      -- Index pour améliorer les performances
      CREATE INDEX IF NOT EXISTS idx_team_user ON teams_local(user_id);
      CREATE INDEX IF NOT EXISTS idx_char_slot ON characters_local(slot);
    `);

    console.log('✅ Tables créées avec succès');

    // Vérifier que les tables existent
    const tables = await db.getAllAsync(`
      SELECT name FROM sqlite_master WHERE type='table'
    `);
    console.log('📋 Tables disponibles:', tables.map(t => t.name));

    return db;

  } catch (error) {
    console.error('❌ Erreur initialisation DB:', error);
    throw error;
  }
};

// 🆕 Fonction pour charger les personnages de base depuis MongoDB
export const loadBaseCharacters = async () => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    const db = getDB();

    if (!token) {
      console.warn('⚠️ Pas de token, impossible de charger les personnages');
      return []; // ⬅️ Retourner un tableau vide
    }

    const response = await fetch(`${API_URL}/getAllCharacters`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    const characters = await response.json();
    console.log(`📦 ${characters.length} personnages récupérés`);

    // Insérer dans SQLite
    for (const char of characters) {
      await db.runAsync(
        `INSERT OR REPLACE INTO characters_local
         (id, name, type, vision, base_atk, base_hp, elemental_mastery, image, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          char.id,
          char.name,
          char.type,
          char.vision,
          char.base_atk || 0,
          char.base_hp || 0,
          char.elemental_mastery || 0,
          char.image || '',
          Math.floor(Date.now() / 1000)
        ]
      );
    }

    await db.runAsync(
      'INSERT OR REPLACE INTO sync_meta (key, value) VALUES (?, ?)',
      ['base_characters_loaded', 'true']
    );

    console.log('✅ Personnages de base sauvegardés dans SQLite');

    return characters; // ⬅️ RETOURNER les personnages

  } catch (error) {
    console.error('❌ Erreur loadBaseCharacters:', error);
    return []; // ⬅️ Retourner tableau vide en cas d'erreur
  }
};


// 📖 Récupérer toutes les teams locales
export const getLocalTeams = () => {
  try {
    const db = getDB();
    const result = db.getAllSync('SELECT * FROM teams_local');
    return result;
  } catch (error) {
    console.error('Erreur getLocalTeams:', error);
    return [];
  }
};

// ✏️ Sauvegarder un slot de team localement
export const saveTeamSlot = async (slot, characterId) => {
  try {
    const db = getDB();

    // 1️⃣ Récupérer l'équipe actuelle (ou créer)
    let team = await db.getFirstAsync('SELECT * FROM teams_local LIMIT 1');

    if (!team) {
      // Créer une équipe vide
      await db.runAsync(
        `INSERT INTO teams_local (id, user_id, slots, updated_at, dirty)
         VALUES (?, ?, ?, ?, 1)`,
        [
          'main_team',
          'local_user',
          JSON.stringify({ slot1: null, slot2: null, slot3: null, slot4: null }),
          Math.floor(Date.now() / 1000)
        ]
      );
      team = await db.getFirstAsync('SELECT * FROM teams_local LIMIT 1');
    }

    // 2️⃣ Parser les slots
    const slots = JSON.parse(team.slots);

    // 3️⃣ Modifier le slot
    slots[slot] = characterId;

    // 4️⃣ Sauvegarder
    await db.runAsync(
      'UPDATE teams_local SET slots = ?, dirty = 1, updated_at = ? WHERE id = ?',
      [JSON.stringify(slots), Math.floor(Date.now() / 1000), team.id]
    );

    console.log(`✅ Slot ${slot} sauvegardé avec character`);
  } catch (error) {
    console.error('❌ Erreur saveTeamSlot:', error);
    throw error;
  }
};


// 🗑️ Supprimer un slot de team localement
export const removeTeamSlot = async (slot) => {
  try {
    const database = getDB();

    // 1️⃣ Récupérer l'équipe actuelle
    const team = await database.getFirstAsync('SELECT * FROM teams_local LIMIT 1');

    if (!team) {
      console.log('⚠️ Aucune équipe trouvée');
      return;
    }

    // 2️⃣ Parser le JSON
    const slots = JSON.parse(team.slots);

    // 3️⃣ Vider le slot
    if (slots[slot] === null || slots[slot] === undefined) {
      console.log('⚠️ Slot déjà vide');
      return;
    }

    slots[slot] = null;

    // 4️⃣ Sauvegarder
    await database.runAsync(
      'UPDATE teams_local SET slots = ?, dirty = 1, updated_at = ? WHERE id = ?',
      [JSON.stringify(slots), Math.floor(Date.now() / 1000), team.id]
    );

    console.log('✅ Slot supprimé:', slot);
  } catch (error) {
    console.error('❌ Erreur removeTeamSlot:', error);
    throw error;
  }
};

// ✏️ Sauvegarder un artifact localement
export const saveArtifact = (characterId, slot, mainStat, statValue) => {
  try {
    const db = getDB();
    const id = `${characterId}_${slot}`;
    const now = new Date().toISOString();

    db.runSync(
      `INSERT OR REPLACE INTO artifacts_local (id, character_id, slot, main_stat, stat_value, updated_at, dirty)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [id, characterId, slot, mainStat, statValue || '', now]
    );

    console.log('✅ Artifact sauvegardé localement');
  } catch (error) {
    console.error('Erreur saveArtifact:', error);
  }
};

// 🗑️ Supprimer un artifact localement
export const removeArtifactLocal = (characterId, slot) => {
  try {
    const db = getDB();
    db.runSync(
      'DELETE FROM artifacts_local WHERE character_id = ? AND slot = ?',
      [characterId, slot]
    );
    console.log('✅ Artifact supprimé localement');
  } catch (error) {
    console.error('Erreur removeArtifactLocal:', error);
  }
};

// ⚠️ Récupérer les données "dirty" (à synchroniser)
export const getDirtyData = () => {
  try {
    const db = getDB();
    const teams = db.getAllSync('SELECT * FROM teams_local WHERE dirty = 1');
    const artifacts = db.getAllSync('SELECT * FROM artifacts_local WHERE dirty = 1');

    return {
      teams: teams || [],
      artifacts: artifacts || []
    };
  } catch (error) {
    console.error('Erreur getDirtyData:', error);
    return { teams: [], artifacts: [] };
  }
};

// ✅ Marquer comme "propre" après synchro
export const markAsClean = () => {
  try {
    const db = getDB();
    db.runSync('UPDATE teams_local SET dirty = 0');
    db.runSync('UPDATE artifacts_local SET dirty = 0');
    console.log('✅ Données marquées comme propres');
  } catch (error) {
    console.error('Erreur markAsClean:', error);
  }
};

// 🕒 Last sync
export const getLastSync = () => {
  try {
    const db = getDB();
    const result = db.getFirstSync(
      'SELECT value FROM sync_meta WHERE key = ?',
      ['last_sync']
    );
    return result?.value || null;
  } catch (error) {
    console.error('Erreur getLastSync:', error);
    return null;
  }
};

export const setLastSync = (timestamp) => {
  try {
    const db = getDB();
    db.runSync(
      'INSERT OR REPLACE INTO sync_meta (key, value) VALUES (?, ?)',
      ['last_sync', timestamp]
    );
    console.log('✅ Last sync mis à jour:', timestamp);
  } catch (error) {
    console.error('Erreur setLastSync:', error);
  }
};
