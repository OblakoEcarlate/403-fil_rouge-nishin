import * as SQLite from 'expo-sqlite';
import Constants from 'expo-constants';
import { fetchLocalTeamData } from '../local/teamService';

const API_BASE_URL = Constants.expoConfig.extra.API_BASE_URL;

export async function pushTeamChanges(token) {
  try {
    const db = await SQLite.openDatabaseAsync('nishin.db');

    if (!token) {
      console.warn('⚠️ Aucun token utilisateur trouvé, impossible de push.');
      return;
    }

    // 1️⃣ Récupère la team locale
    const localTeam = await db.getFirstAsync('SELECT * FROM teams_local LIMIT 1');

    if (!localTeam) {
      console.log('⚠️ Aucune team locale à synchroniser.');
      return;
    }

    if (!localTeam.dirty) {
      console.log('✅ Aucune modification locale détectée (dirty = 0).');
      return;
    }

    // 2️⃣ Parse les slots
    let slots = localTeam.slots;
    if (typeof slots === 'string') {
      try {
        slots = JSON.parse(slots);
      } catch {
        console.warn('⚠️ Erreur parsing slots, annulation du push.');
        return;
      }
    }

    // 3️⃣ Construction du payload
    const payload = {
      team: {
        id: localTeam.id,
        slots: slots,
        updated_at: new Date(localTeam.updated_at).toISOString(),
      },
    };

    console.log('📤 Envoi du push team vers le serveur:', payload);

    // 4️⃣ Envoi au serveur
    const response = await fetch(`${API_BASE_URL}/sync/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Erreur lors du push');
    }

    const result = await response.json();
    console.log('✅ Réponse du serveur:', result);

    // 5️⃣ Met à jour la team locale
    const newSlots = result.team.slots ?? slots;
    const newUpdatedAt = result.team.updated_at ?? localTeam.updated_at;

    await db.runAsync(
      `UPDATE teams_local
       SET slots = ?, updated_at = ?, dirty = 0
       WHERE id = ?`,
      [JSON.stringify(newSlots), newUpdatedAt, localTeam.id]
    );

    console.log('💾 Team locale synchronisée avec le serveur.');

    // 6️⃣ Ferme la connexion
    await db.closeAsync?.();
    await fetchLocalTeamData();
  } catch (error) {
    console.error('❌ Erreur dans pushTeamChanges:', error);
  }
};