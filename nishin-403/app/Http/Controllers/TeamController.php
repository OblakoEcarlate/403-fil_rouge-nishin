<?php

namespace App\Http\Controllers;

use App\Models\Character;
use App\Models\Team;
use Illuminate\Http\Request;

class TeamController extends Controller
{
    // TODO : composition d'une équipe d'au moins 1 personnage DPS (par la suite il peut y avoir des supports)
    // TODO : il me faut surement une collection team pour "enregistrer" les données d'une équipe par user
//    relation 1 - 1 un user a UNE équipe
// TODO : créer collection "teams" lié à un user avec les personnages et slot dans un objet team
// TODO : mettre une condition pour quand c'est pas le bon user de connecté pour qu'il ait que SON équipe
    public function addCharacterToSlot1(Request $request)
    {
        $request->validate([
            'team_id' => 'required|exists:teams,_id',
            'character_id' => 'required|exists:characters,_id'
        ]);

        $team = Team::where('_id', $request->team_id)->first();
        $character = Character::where('_id', $request->character_id)->first();

        if (!$team->isSlotAvailable('slot1')) {
            return response()->json(['error' => 'ERREUR : Slot 1 déjà rempli !'], 400);
        }

        if ($character->type !== "DPS") {
            return response()->json(['error' => 'ERREUR : Seuls les personnages DPS peuvent être placés dans le slot 1 !'], 400);
        }

        $team->assignToSlot('slot1', $character);

        $character->slot = 1;

        $team->save();
        $character->save();

        return response()->json([
            'message' => 'Personnage assigné au slot1 avec succès !',
            'team' => $team->fresh(['slots']),
            'character' => $character->fresh()
        ]);
    }

//    TODO : Vérif l'erreur 500
    public function addCharacterToSlot(Request $request)
    {
        $request->validate([
            'team_id' => 'required|exists:teams,_id',
            'character_id' => 'required|exists:characters,_id'
        ]);

        $validSlots = ['slot1', 'slot2', 'slot3', 'slot4'];
        $slot = $request->slot;

        if (!in_array($slot, $validSlots)) {
            return response()->json(['error' => 'ERREUR : slot invalide'], 400);
        }

        $team = Team::where('_id', $request->team_id)->first();
        $character = Character::where('_id', $request->character_id)->first();

        if (!$team->isSlotAvailable($slot)) {
            return response()->json(['error' => 'ERREUR : Slot déjà rempli !'], 400);
        }

        if ($character->type == "DPS" && $team->isSlotAvailable('slot1')) {
            $team->assignToSlot('slot1', $character);
            $character->slot = 1;
        }

        if ($character->type == "SUPPORT" && ($team->isSlotAvailable($slot) && $slot !== 'slot1')) {
            $team->assignToSlot($slot, $character);
            $character->slot = $slot;
        }

        $team->save();
        $character->save();

        return response()->json([
            'message' => 'Personnage assigné au slot' . $slot . 'avec succès !',
            'team' => $team->fresh(['slots']),
            'character' => $character->fresh()
        ]);
    }

    public function removeCharacterFromSlot(Request $request)
    {
        $request->validate([
            'team_id' => 'required|exists:teams,_id',
            'character_id' => 'required|exists:characters,_id',
            'slot' => 'required|in:slot1,slot2,slot3,slot4'
        ]);

        $team = Team::where('_id', $request->team_id)->first();
        $character = Character::where('_id', $request->character_id)->first();
        $slot = $request->slot;

        if (!isset($team->slots[$slot]) || !isset($team->slots[$slot]['id']) || $team->slots[$slot]['id'] != $character->_id) {
            return response()->json(['error' => 'Ce personnage n\'est pas dans le slot spécifié'], 400);
        }

        $team->unassignFromSlot($slot, $character);
        $character->slot = 0;

        $team->save();
        $character->save();


        return response()->json([
            'message' => 'Personnage retiré avec succès',
            'team' => $team->fresh(),
            'character' => $character->fresh()
        ]);
    }



    public function getTeam(Request $request)
    {
        $team = Team::where('_id', $request->team_id)->first();

        echo $team;
    }
}
