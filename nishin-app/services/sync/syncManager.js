import { getDatabase } from '../database';
import { fullSyncCharacters } from './fullSyncCharacters';
import { fullSyncTeams } from './fullSyncTeams';

export async function maybeRunFullSync(token) {
    const db = await getDatabase();

    const resultCharacters = await db.getAllAsync("SELECT COUNT(*) as count FROM characters_local");
    const countCharacters = resultCharacters[0]?.count || 0;

    const resultTeams = await db.getAllAsync("SELECT COUNT(*) as count FROM teams_local");
    const countTeams = resultTeams[0]?.count || 0;

    if (countCharacters === 0) {
        console.log('🚀 Base locale characters vide → Exécution du full sync...');
        await fullSyncCharacters(token);
        console.log('✅ Sync characters terminé.');
    } else {
        console.log('💾 Données locales de characters déjà présentes → aucun full sync.');
    }

    if (countTeams === 0) {
        console.log('🚀 Base locale teams vide → Exécution du full sync...');
        await fullSyncTeams(token);
        console.log('✅ Sync teams terminé.');
    } else {
        console.log('💾 Données locales de teams déjà présentes → aucun full sync.');
    }
}
