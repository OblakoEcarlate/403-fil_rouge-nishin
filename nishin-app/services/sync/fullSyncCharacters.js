import { getDatabase } from '../../services/database';
import Constants from 'expo-constants';

// 🔧 Change cette URL si ton API n'est pas locale
const API_URL = Constants.expoConfig.extra.API_BASE_URL;

export async function fullSyncCharacters(token) {
  const db = await getDatabase();

  console.log('🔄 Démarrage du full sync characters (serveur → local)...');

  try {
    const response = await fetch(`${API_URL}/sync/full`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const characters = data.characters || [];
    const serverTimestamp = data.serverTimestamp || Math.floor(Date.now() / 1000);

    console.log(`📥 ${characters.length} personnages reçus depuis le serveur.`);

    for (const c of characters) {
      const updatedAt = Math.floor(new Date(c.updated_at).getTime() / 1000);

      await db.runAsync(
        `INSERT OR REPLACE INTO characters_local
        (id, name, type, image, base_atk, elemental_mastery, base_hp, vision, slot, data, updated_at, deleted_at, dirty)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [
          c.id,
          c.name,
          c.type,
          c.image,
          c.base_atk,
          c.elemental_mastery,
          c.base_hp,
          c.vision,
          c.slot ?? 0,
          JSON.stringify({
            skill: c.skill,
            buff: c.buff,
            artifact: c.artifact,
            elemental_bonus: c.elemental_bonus,
          }),
          updatedAt,
          null,
        ]
      );
    }

    console.log(`✅ ${characters.length} personnages insérés dans la base locale.`);
    console.log('🕒 Timestamp serveur :', serverTimestamp);

  } catch (err) {
    console.error('❌ Erreur pendant le full sync :', err.message);
  }
}
