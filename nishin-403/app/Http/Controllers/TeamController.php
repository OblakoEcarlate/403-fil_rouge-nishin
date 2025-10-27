<?php

namespace App\Http\Controllers;

use App\Models\Character;
use App\Models\Team;
use Illuminate\Http\Request;

class TeamController extends Controller
{
// relation 1 - 1 un user a UNE équipe
// TODO : créer collection "teams" lié à un user avec les personnages et slot dans un objet team
// TODO : mettre une condition pour quand c'est pas le bon user de connecté pour qu'il ait que SON équipe
//    TODO : Vérif l'erreur 500

    public function getAllCharacters()
    {
        $characters = Character::all();

        return $characters;
    }

    protected function findCharacterById(string $id)
    {
        return Character::find($id);
    }


    /*
    * Ajout d'un personnage dans un slot
    */
    public function addCharacterToSlot(Request $request)
    {
        // ✅ VALIDATION DE L'INPUT
        $validSlots = ['slot1', 'slot2', 'slot3', 'slot4'];
        $slot = $request->slot;
        $team = $this->getTeam($request);
        // $character = Character::find($request->character_id);
        $character = $this->findCharacterById($request->character_id);

        if (!$character) {
            return response()->json(['error' => 'Personnage introuvable'], 404);
        }

        if (!in_array($slot, $validSlots)) {
            return response()->json(['error' => 'ERREUR : slot invalide'], 400);
        }

        // ✅ VÉRIFICATION — le perso est-il déjà dans la team ?
        $isCharacterInTeam = in_array((string) $character->_id, $team->slots ?? [], true);
        if ($isCharacterInTeam) {
            return response()->json(['error' => "Ce personnage est déjà dans l'équipe"], 400);
        }

        // ✅ VÉRIF SLOT LIBRE
        if (!$team->isSlotAvailable($slot)) {
            return response()->json(['error' => 'ERREUR : Slot déjà rempli !'], 400);
        }

        // ✅ ASSIGNATION selon le type
        if ($character->type === "DPS") {
            if ($team->isSlotAvailable('slot1')) {
                $team->assignToSlot('slot1', $character);
            } else {
                return response()->json(['error' => 'Le slot1 (DPS) est déjà occupé !'], 400);
            }
        } elseif ($character->type === "SUPPORT") {
            if ($slot !== 'slot1' && $team->isSlotAvailable($slot)) {
                $team->assignToSlot($slot, $character);
            } else {
                return response()->json(['error' => 'Slot invalide ou déjà pris pour un support'], 400);
            }
        } else {
            return response()->json(['error' => 'Type de personnage inconnu'], 400);
        }

        // ✅ SAUVEGARDE uniquement la team
        $team->save();

        // ✅ RETOUR JSON enrichi (avec infos des persos)
        return response()->json([
            'team' => [
                '_id' => $team->_id,
                'slots' => $team->getSlotsWithCharacters(), // ⚡ ici on renvoie les persos complets
                'user_id' => $team->user_id,
                'created_at' => $team->created_at,
                'updated_at' => $team->updated_at,
            ]
        ]);
    }


    /*
    * Suppression d'un personnage précis d'un slot
    */
    public function removeCharacterFromSlot(Request $request)
    {
        $team = $this->getTeam($request);
        $character = Character::find($request->character_id);
        $slot = $request->slot;

        if (!$character) {
            return response()->json(['error' => 'Personnage introuvable'], 404);
        }

        // ⚙️ On récupère la valeur stockée dans le slot (peut être un string OU un array)
        $slotValue = $team->slots[$slot] ?? null;
        $slotCharacterId = is_array($slotValue) ? ($slotValue['id'] ?? null) : $slotValue;

        // 🚫 Si le slot est vide ou ne correspond pas à ce perso
        if (!$slotCharacterId || (string)$slotCharacterId !== (string)$character->_id) {
            return response()->json(['error' => 'Ce personnage n\'est pas dans ce slot'], 400);
        }

        // ✅ Désassignation
        $team->unassignFromSlot($slot, $character);

        // ✅ Sauvegarde uniquement la Team (on ne touche pas au Character)
        $team->save();

        // ✅ Retour JSON enrichi
        return response()->json([
            'team' => [
                '_id' => $team->_id,
                'slots' => $team->getSlotsWithCharacters(),
                'user_id' => $team->user_id,
                'created_at' => $team->created_at,
                'updated_at' => $team->updated_at,
            ]
        ]);
    }



    /*
     * RECUPERATION DE L'EQUIPE EN COURS
     */
    public function getTeam(Request $request)
    {
        $user = $request->user();

        $team = Team::where('user_id', $user->id)->first();

        if (!$team) {
            return response()->json([
                'message' => 'Aucune team trouvée pour cet utilisateur'
            ], 404);
        }

        $team->slots = $team->populateSlots();

        return $team;
    }

    public function getTeamForBackend(Request $request): Team
    {
        $user = auth()->user();
        return Team::where('user_id', $user->_id)->firstOrFail();
    }
}
