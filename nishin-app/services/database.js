import Constants from 'expo-constants';
import * as SQLite from 'expo-sqlite';

const API_URL = Constants.expoConfig.extra.API_BASE_URL;

let db = null;

export async function getDatabase() {
  if (!db) {
    db = await SQLite.openDatabaseAsync('nishin.db');
  }
  return db;
}

export async function closeDatabase() {
  if (db) {
    await db.closeAsync();
    db = null;
    console.log('🔒 Database connection closed.');
  }
}

export async function deleteDatabase() {
  await closeDatabase();
  await SQLite.deleteDatabaseAsync('nishin.db');
  console.log('🗑️ Database deleted.');
}

export async function setupDatabase() {
  const db = await getDatabase();

  await db.runAsync("CREATE TABLE IF NOT EXISTS teams_local (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, slots TEXT, updated_at INTEGER DEFAULT (strftime('%s','now')), dirty INTEGER DEFAULT 0)");

  await db.runAsync("CREATE TABLE IF NOT EXISTS characters_local (id TEXT PRIMARY KEY, name TEXT, type TEXT, image TEXT, base_atk INTEGER, elemental_mastery INTEGER, base_hp INTEGER, vision TEXT, slot INTEGER DEFAULT 0, data TEXT, updated_at INTEGER DEFAULT (strftime('%s','now')), deleted_at INTEGER, dirty INTEGER DEFAULT 0)");

  await db.runAsync("CREATE TABLE IF NOT EXISTS sync_meta (key TEXT PRIMARY KEY, value TEXT)");

  await db.runAsync("CREATE INDEX IF NOT EXISTS idx_team_user ON teams_local(user_id)");

  await db.runAsync("CREATE INDEX IF NOT EXISTS idx_char_slot ON characters_local(slot)");

  console.log('Local database initialized.');
}