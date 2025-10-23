import { getDatabase } from '../database';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig.extra.API_BASE_URL;

export async function fullSyncTeams(token) {
  const db = await getDatabase();

  console.log('🔄 Démarrage du full sync teams (serveur → local)...');

  try {
    // 1️⃣ Appel de ton API Laravel qui renvoie la team complète
    const response = await fetch(`${API_URL}/sync/full`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();

    // 2️⃣ Structure attendue : { team: { _id, user_id, slots: {...}, updated_at } }
    const team = data.team;
    if (!team) throw new Error('Aucune team reçue du serveur');

    console.log(`📥 Team reçue depuis le serveur : ${team._id}`);

    // 3️⃣ Préparation des champs
    const teamId = team.id;
    const userId = team.user_id ?? null;
    const slotsJson = JSON.stringify(team.slots ?? {});
    const updatedAt = Math.floor(new Date(team.updated_at).getTime() / 1000);

    // 4️⃣ Création / mise à jour dans SQLite
    await db.runAsync(
      `INSERT OR REPLACE INTO teams_local
       (id, user_id, slots, updated_at, dirty)
       VALUES (?, ?, ?, ?, 0)`,
      [teamId, userId, slotsJson, updatedAt]
    );

    console.log('✅ Team synchronisée dans teams_local.');

  } catch (err) {
    console.error('❌ Erreur pendant le full sync Team :', err.message);
  }
}