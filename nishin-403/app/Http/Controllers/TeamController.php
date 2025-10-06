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


    /*
     * Ajout d'un personnage dans un slot
     */
    public function addCharacterToSlot(Request $request)
    {
// VALIDATION DE L'INPUT -------------
        $request->validate([
            'team_id' => 'required|exists:teams,_id',
            'character_id' => 'required|exists:characters,_id'
        ]);

        $validSlots = ['slot1', 'slot2', 'slot3', 'slot4'];
        $slot = $request->slot;
        $team = Team::where('_id', $request->team_id)->first();
        $character = Character::where('_id', $request->character_id)->first();


// VERIFICATION -------------------
        $isCharacterInTeam = false;
        foreach ($team->slots as $slotCharacter) {
            if (isset($slotCharacter['id']) && $slotCharacter['id'] == $character->_id) {
                $isCharacterInTeam = true;
                break;
            }
        }

        if ($isCharacterInTeam) {
            return response()->json(['error' => "Ce personnage est déjà dans l'équipe"], 400);
        }

        if (!$team->isSlotAvailable($slot)) {
            return response()->json(['error' => 'ERREUR : Slot déjà rempli !'], 400);
        }

        if (!in_array($slot, $validSlots)) {
            return response()->json(['error' => 'ERREUR : slot invalide'], 400);
        }


// ASSIGNATION ------------
        if ($character->type == "DPS" && $team->isSlotAvailable('slot1')) {
            $team->assignToSlot('slot1', $character);
            $character->slot = 1;
        }

        if ($character->type == "SUPPORT" && ($team->isSlotAvailable($slot) && $slot !== 'slot1')) {
            $team->assignToSlot($slot, $character);
            $character->slot = $slot;
        }

// SAVE DE L'ETAT ----------------
        $team->save();
        $character->save();

        return response()->json([
            'team' => $team->fresh(['slots']),
            'character' => $character->fresh()
        ]);
    }

    /*
     * Suppression d'un personnage précis d'un slot
     */
    public function removeCharacterFromSlot(Request $request)
    {
// VALIDATION DE L'INPUT -------------
        $request->validate([
            'team_id' => 'required|exists:teams,_id',
            'character_id' => 'required|exists:characters,_id',
            'slot' => 'required|in:slot1,slot2,slot3,slot4'
        ]);

        $team = Team::where('_id', $request->team_id)->first();
        $character = Character::where('_id', $request->character_id)->first();
        $slot = $request->slot;


// CONDITION -------------------
        if (!isset($team->slots[$slot]) || !isset($team->slots[$slot]['id']) || $team->slots[$slot]['id'] != $character->_id) {
            return response()->json(['error' => 'Ce personnage n\'est pas dans le slot spécifié'], 400);
        }


// ASSIGNATION ------------
        $team->unassignFromSlot($slot, $character);
        $character->slot = 0;


// SAVE DE L'ETAT ------------
        $team->save();
        $character->save();


        return response()->json([
            'team' => $team->fresh(),
            'character' => $character->fresh()
        ]);
    }


    /*
     * FONCTION DE TEST POUR L'INSTANT
     */
    public function getTeam(Request $request)
    {
        $team = Team::where('_id', $request->team_id)->first();

        return $team;
    }
}
