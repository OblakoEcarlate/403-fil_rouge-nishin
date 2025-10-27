import { getDatabase } from '../database';
import Constants from 'expo-constants';


async function getLastSyncCharacters(db) {
  const res = await db.getAllAsync("SELECT value FROM sync_meta WHERE key = 'lastSyncCharacters'");
  return res.length ? parseInt(res[0].value) : 0;
}


async function setLastSyncCharacters(db, timestamp) {
  await db.runAsync("INSERT OR REPLACE INTO sync_meta (key, value) VALUES ('lastSyncCharacters', ?)", [timestamp]);
}


export async function pullChangesCharacters(token) {
  const db = await getDatabase();
  const API_URL = Constants.expoConfig.extra.API_BASE_URL;

  console.log('🔄 Début de la synchronisation des characters incrémentale...');

  // 1️⃣ On récupère le dernier timestamp local
  const lastSync = await getLastSyncCharacters(db);
  console.log('🕒 Dernier timestamp connu:', lastSync);

  try {
    const res = await fetch(`${API_URL}/sync/changes?since=${lastSync}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const characters = data.characters || [];
    const serverTimestamp = data.serverTimestamp || Math.floor(Date.now() / 1000);

    console.log(`📥 ${characters.length} personnages modifiés reçus.`);

    // 3️⃣ Mise à jour locale
    for (const c of characters) {
        const updatedAt = Math.floor(new Date(c.updated_at).getTime() / 1000);

        if (c.deleted_at) {
            // ⚠️ suppression locale
            await db.runAsync("DELETE FROM characters_local WHERE id = ?", [c.id]);
            console.log(`🗑️ Supprimé localement : ${c.name}`);
            continue;
        }

        // sinon : update ou insert classique
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

    // 4️⃣ Enregistrer le timestamp du serveur
    await setLastSyncCharacters(db, serverTimestamp);

    console.log('✅ Synchronisation incrémentale des characters terminée.');
  } catch (err) {
    console.error('❌ Erreur pendant la synchro des characters incrémentale :', err.message);
  }
}


// 🔹 Gestion du timestamp de dernière synchro
async function getLastSyncTeams(db) {
  const res = await db.getAllAsync("SELECT value FROM sync_meta WHERE key = 'lastSyncTeams'");
  return res.length ? parseInt(res[0].value) : 0;
}

async function setLastSyncTeams(db, timestamp) {
  await db.runAsync("INSERT OR REPLACE INTO sync_meta (key, value) VALUES ('lastSyncTeams', ?)", [timestamp]);
}

// 🔹 Fonction principale : synchro d'une seule team
export async function pullChangesTeams(token) {
  const db = await getDatabase();
  const API_URL = Constants.expoConfig.extra.API_BASE_URL;

  console.log('🔄 Début de la synchronisation incrémentale de la team...');

  // 1️⃣ Récupération du dernier timestamp local
  const lastSync = await getLastSyncTeams(db);
  console.log('🕒 Dernier timestamp connu (team):', lastSync);

  try {
    // 2️⃣ Appel à l’API Laravel
    const res = await fetch(`${API_URL}/sync/changes?since=${lastSync}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // ✅ Structure attendue : { team: { ... }, serverTimestamp: ... }
    const team = data.team[0] || null;
    const serverTimestamp = data.serverTimestamp || Math.floor(Date.now() / 1000);

    console.log(team)

    if (!team) {
      console.log('⚠️ Aucune mise à jour de team trouvée sur le serveur.');
      await setLastSyncTeams(db, serverTimestamp);
      return;
    }

    console.log(`📥 Team mise à jour reçue : ${team.id}`);

    // 3️⃣ Mise à jour locale directe (une seule team)
    const updatedAt = Math.floor(new Date(team.updated_at).getTime() / 1000);

    await db.runAsync(
    `INSERT OR REPLACE INTO teams_local
    (id, user_id, slots, updated_at, dirty)
    VALUES (?, ?, ?, ?, ?)`,
    [
        team.id,
        team.user_id ?? null,
        JSON.stringify(team.slots ?? {}),
        updatedAt,
        0
    ]
    );

    console.log(`✅ Team synchronisée localement (id: ${team.id})`);

    // 4️⃣ Enregistrer le nouveau timestamp
    await setLastSyncTeams(db, serverTimestamp);

    console.log('✅ Synchronisation incrémentale de la team terminée.');
  } catch (err) {
    console.error('❌ Erreur pendant la synchro incrémentale de la team :', err.message);
  }
}