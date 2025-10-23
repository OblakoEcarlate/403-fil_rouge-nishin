import { getDatabase } from './database';


export async function testDatabaseConnection() {
  try {
    const db = await getDatabase();
    const result = await db.getAllAsync('PRAGMA database_list;');
    console.log('✅ Database connection OK:', result);
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
}


export async function checkTables() {
  try {
    const db = await getDatabase();
    const tables = await db.getAllAsync(`
      SELECT name FROM sqlite_master WHERE type='table';
    `);
    console.log('📋 Tables in local DB:', tables.map(t => t.name));
  } catch (error) {
    console.error('❌ Failed to list tables:', error);
  }
}


export async function describeTable() {
  const db = await getDatabase();
    const results = await db.getAllAsync(`
    SELECT name, sql
    FROM sqlite_master
    WHERE type='table' AND name NOT LIKE 'sqlite_%';
    `);

    results.forEach(r => {
    console.log(`📄 Table: ${r.name}`);
    console.log(r.sql); // contient le DDL complet : colonnes, types, contraintes
    });
}

export async function testInsertCharacter() {
  const db = await getDatabase();
  const timestamp = Math.floor(Date.now() / 1000);

  await db.runAsync(
    "INSERT OR REPLACE INTO characters_local (id, name, type, base_atk, elemental_mastery, base_hp, vision, slot, data, updated_at, dirty) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      "char-test-001",
      "Diluc",
      "Pyro",
      335,
      0,
      12000,
      "Pyro",
      1,
      JSON.stringify({ skill: "Searing Onslaught", level: 6 }),
      timestamp,
      1
    ]
  );

  console.log("✅ Character inserted successfully");

  // lecture de la ligne insérée
  const rows = await db.getAllAsync("SELECT * FROM characters_local WHERE id = ?", ["char-test-001"]);

  if (rows.length > 0) {
    console.log("📦 Character fetched from DB:");
    console.log(rows);
  } else {
    console.warn("⚠️ Character not found after insert — check your schema or transaction.");
  }
}

export async function dumpCharacters() {
  const db = await getDatabase();
  const rows = await db.getAllAsync("SELECT id, name, vision, base_atk, updated_at, deleted_at FROM characters_local");

  console.log('📄 Liste de personnages stockés localement :');
  rows.forEach((r, i) => {
    console.log(`${i + 1}. ${r.name} (${r.vision}) - ATK: ${r.base_atk} | updated_at: ${r.updated_at} | deleted_at: ${r.deleted_at}`);
  });
}

export async function dumpTeams() {
  const db = await getDatabase();
  const team = await db.getFirstAsync("SELECT id, user_id, slots, updated_at, dirty FROM teams_local");

  if (!team) {
    console.log('⚠️ Aucune team stockée localement.');
    return;
  }

  console.log('📄 Team locale :');

  // On parse les slots (stockés en JSON stringifié)
  let slots;
  try {
    slots = JSON.parse(team.slots);
  } catch (e) {
    slots = {};
  }

  // On construit un résumé lisible
  const slotSummary = Object.entries(slots)
    .map(([slotName, slotValue]) => {
      if (!slotValue) return `${slotName}: [vide]`;
      // Si c’est un objet (avec name), on affiche le nom du perso
      const name = typeof slotValue === 'object' ? slotValue.name ?? slotValue._id : slotValue;
      return `${slotName}: ${name}`;
    })
    .join(' | ');

  console.log(`🧩 ID: ${team.id}`);
  console.log(`👤 User: ${team.user_id}`);
  console.log(`🎯 Slots → ${slotSummary}`);
  console.log(`🕒 updated_at: ${team.updated_at} | 🧭 dirty: ${team.dirty}`);
}