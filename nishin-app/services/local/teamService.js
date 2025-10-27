import * as SQLite from 'expo-sqlite';

export async function initializeLocalData() {
  const db = await SQLite.openDatabaseAsync('nishin.db');
  console.log('🚀 Initialisation locale des données...');

  let fullTeam = null;
  let localCharacters = [];
  
  try {
    const localTeam = await db.getFirstAsync('SELECT * FROM teams_local LIMIT 1');

    if (localTeam) {
      console.log('📂 Team locale trouvée :', localTeam.id);

      const characters = await db.getAllAsync('SELECT * FROM characters_local');
      const charactersMap = Object.fromEntries(characters.map(c => [c.id, c]));

      // 🔍 1. Parser proprement les slots
      let slotsData = localTeam.slots;
      if (typeof slotsData === 'string') {
        try {
          slotsData = JSON.parse(slotsData);
        } catch (e) {
          console.warn('⚠️ Erreur de parsing JSON des slots:', e);
          slotsData = {};
        }
      }

      // 🔍 2. Reconstruire chaque slot avec les bons persos
      const enrichedSlots = {};

      for (const [slotName, slotValue] of Object.entries(slotsData)) {
        if (!slotValue) {
          enrichedSlots[slotName] = null;
          continue;
        }

        // Supporte les deux formats : id direct ou objet { _id }
        const charId =
          typeof slotValue === 'string'
            ? slotValue
            : slotValue._id ?? slotValue.id;

        const fullChar = charactersMap[charId] || null;
        enrichedSlots[slotName] = fullChar;
      }

      const fullTeam = {
        ...localTeam,
        slots: enrichedSlots,
      };

      console.log('✅ Team enrichie :', fullTeam);
    } else {
      console.log('⚠️ Aucune team locale trouvée');
      return null;
    }

    // Charger les personnages locaux
    const localCharacters = await db.getAllAsync('SELECT * FROM characters_local');

    if (localCharacters.length > 0) {
      console.log(`📦 ${localCharacters.length} personnages locaux chargés`);
    } else {
      console.log('⚠️ Aucun personnage local trouvé');
    }

    console.log('✅ Initialisation locale terminée');

    return { fullTeam, localCharacters };
  } catch (error) {
    console.error('❌ Erreur initialisation locale :', error.message);
  }
};


export async function fetchLocalTeamData() {
  try {
    const db = await SQLite.openDatabaseAsync('nishin.db');
    console.log('🚀 Fetch locale des données de team...');

    const localTeam = await db.getFirstAsync('SELECT * FROM teams_local LIMIT 1');
    if (!localTeam) {
      console.log('⚠️ Aucune team locale trouvée');
      return null;
    }

    console.log('📂 Team locale trouvée :', localTeam.id);

    // Charger les persos locaux
    const characters = await db.getAllAsync('SELECT * FROM characters_local');
    const charactersMap = Object.fromEntries(characters.map(c => [c.id, c]));

    // 🔍 Parser les slots proprement
    let slotsData = {};
    if (localTeam.slots) {
      try {
        slotsData = typeof localTeam.slots === 'string'
          ? JSON.parse(localTeam.slots)
          : localTeam.slots;
      } catch (err) {
        console.warn('⚠️ Erreur parsing JSON des slots :', err);
        slotsData = {};
      }
    }

    // 🔍 Reconstruire les slots enrichis
    const enrichedSlots = {};
    for (const [slotName, slotValue] of Object.entries(slotsData)) {
      if (!slotValue) {
        enrichedSlots[slotName] = null;
        continue;
      }

      // Toujours utiliser .id (pas _id)
      const charId =
        typeof slotValue === 'string' ? slotValue : slotValue.id;

      enrichedSlots[slotName] = charactersMap[charId] || null;
    }

    const fullTeam = {
      ...localTeam,
      slots: enrichedSlots,
    };

    // console.log('✅ Team enrichie prête :', fullTeam);
    return fullTeam;
  } catch (error) {
    console.error('❌ Erreur fetchLocalTeamData :', error.message);
    return null;
  }
};