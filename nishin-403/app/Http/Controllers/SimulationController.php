<?php

namespace App\Http\Controllers;

use App\Models\Character;
use App\Models\Team;
use Illuminate\Http\Request;

class SimulationController extends Controller
{
    /**
     * Simuler les dégâts d'un DPS de base
     */
    public function simulateBasicDamageForDPS(Request $request)
    {
        try {
            $character = $this->getSlot1CharacterOfTeam($request);

            if (!$character) {
                throw new \Exception("Personnage non trouvé");
            }

// CALCULS POUR UN DPS ---------------
            if ($character['type'] == "DPS") {
                $baseATK = $character['base_atk'];
                $skillDMG = $character['skill']['elemental_skill']['multiplier'];
                $baseDMG = $baseATK * ($skillDMG / 100);

                return intval($baseDMG);
// CAS D'ERREUR ------------------
            } else if ($character['type'] == "SUPPORT") {
                return response()->json([
                    'success' => false,
                    'message' => "Erreur : Le calcul est impossible, c'est un personnage de type SUPPORT"
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => "Erreur : Type de personnage inconnu"
                ]);
            }

        } catch (\Exception $e) {
            return response()->json([
                'error' => "Erreur dans la simulation pour l'attaque de base",
                'message' => $e->getMessage()
            ], 500);
        }
    }


    /*
    * Simulation de dégats pour le DPS dans le slot 1 avec Artéfact
    */
    public function simulateDamageWithArtifact(Request $request)
    {

        $character = $this->getSlot1CharacterOfTeam($request);

        if (!$character) {
            return response()->json([
                'success' => false,
                'message' => "Aucun personnage dans le slot1"
            ], 404);
        }

        $characterBaseDMG = $this->simulateBasicDamageForDPS($request);

        if ($character['artifact']) {
            $characterArtifactBonus = $this->calculateATKArtifact($request);
        }

            if ($character['type'] == "DPS") {
                $bonusATK = intval($characterBaseDMG) + $characterArtifactBonus;
                $characterDMG = $characterBaseDMG + $bonusATK;
                return $characterDMG;
            } else if ($character['type'] == "SUPPORT") {
                return response()->json([
                    'ERREUR : tu es support'
                ]);
            } else {
                return response()->json([
                    'ERREUR : tu es pas support ni dps'
                ]);
            }
    }

    public function simulateDamageWithBuffForDPS(Request $request)
    {
        $character = $this->getSlot1CharacterOfTeam($request);

        if (!$character) {
            return response()->json([
                'success' => false,
            ]);
        }

        $team = new TeamController();
        $currentTeam = $team->getTeam($request);

        $buff = $this->applyBuff($request);
        $buffData = json_decode($buff->getContent(), true);

        $characterBaseDMG = $this->simulateBasicDamageForDPS($request);

        $baseATK = $character['base_atk'];
        $baseEM = $character['elemental_mastery'];
        $baseElementalDMG = 0;

        // MAITRISE ELEMENTAIRE
        if (!empty($buffData['buffs'][0])) {
            $baseEM += $buffData['buffs'][0];
        }

        // ATQ
        if (!empty($buffData['buffs'][1])) {
            $multiplierATK = $buffData['buffs'][1];
            $bonusATK = $baseATK * $multiplierATK;
            $baseATK = $baseATK + $bonusATK;
        }

        // SUCROSE
        if (!empty($buffData['buffs'][2])) {
            $baseEM += $buffData['buffs'][0];
        }

        // BONUS ELEMENTAIRE
        if (!empty($buffData['buffs'][3])) {
            $multiplierElemental = $buffData['buffs'][3];
            $bonusElemental = $characterBaseDMG * $multiplierElemental;
            $baseElementalDMG = $characterBaseDMG + $bonusElemental;
        }

        return response()->json([
            "base_atk" => $baseATK,
            "base_em" => $baseEM,
            "base_elemental" => $baseElementalDMG
        ]);
    }

    /*
     * LE COEUR DU SUJET - fonction pour calculer les dégats en prenant TOUT en compte
     */
    public function simulateDamageForDPS(Request $request)
    {
        $character = $this->getSlot1CharacterOfTeam($request);

        if (!$character) {
            return response()->json([
                'success' => false,
            ]);
        }

        $baseDMG = $this->simulateBasicDamageForDPS($request);
        $dmgWithArtifact = $this->simulateDamageWithArtifact($request);
        $buffs = $this->simulateDamageWithBuffForDPS($request);
        $buffData = json_decode($buffs->getContent(), true);

        $estimateDMG = $dmgWithArtifact + $buffData["base_atk"];

        $finalDMG = $estimateDMG + $baseDMG;

        return intval($finalDMG);
    }



// PRIVATE ------------------------------
    private function getBuff(Request $request)
    {
        $slots = ['slot2', 'slot3', 'slot4'];

        foreach ($slots as $slot) {
            try {
                $character = $this->getCharacterFromSlot($request, $slot);

                if ($character['type'] == "SUPPORT") {
                    $buffs[] = [
                        'value' => $character['buff']['value'] ?? null,
                        'type' => $character['buff']['type'] ?? null,
                        'name' => $character['buff']['name'] ?? null,
                        'character_name' => $character['name'],
                        'slot' => $slot
                    ];
                }
            } catch (\Exception $e) {
                echo "Erreur $slot: " . $e->getMessage();
            }
        }

        return response()->json([
            'buffs' => $buffs
        ]);
    }


    /**
     * Application d'un buff
     */
    private function applyBuff(Request $request)
    {
        $dps = $this->getSlot1CharacterOfTeam($request);

        $buffResponse = $this->getBuff($request);
        $buffData = json_decode($buffResponse->getContent(), true);

        $buffEMToDPS = 0;
        $buffATKToDPS = 0;
        $buffSucrose = 0;
        $buffElementalToDPS = 0;

        foreach ($buffData['buffs'] as $buff) {
            switch ($buff['type']) {
                case 'elemental_mastery_buff':
                    if ($buff['character_name'] == "Sucrose") {
                        $getArtefact = new ArtifactsController();
                        $statSucrose = $getArtefact->getArtifactsStats($request);
                        $buffSucrose = $buff['value'];
                        $emSlots = ['slot3', 'slot4', 'slot5'];
                        $totalEM = 0;
                        foreach ($emSlots as $slot) {
                            if (!empty($statSucrose[$slot]) && isset($statSucrose[$slot]['main_stat']) && $statSucrose[$slot]['main_stat'] == "EM") {
                                $emValue = $statSucrose[$slot]['stat_value'] ?? 0;
                                $totalEM += $emValue;
                            }
                        }
                        $buffSucrose += $totalEM;
                    }

                    $buffEMToDPS = $buff['value'];
                    break;
                case 'atk_buff':
                    $buffATKToDPS = $buff['value'];
                    break;
                case 'elemental_buff':
                    $buffElementalToDPS = $buff['value'] ?? 0;
                    break;
            }
        }

        return response()->json([
            'success' => true,
            'buffs' => [$buffEMToDPS, $buffATKToDPS, $buffSucrose, $buffElementalToDPS]
        ]);
    }

    /*
     * Calcule les dégats de un ou plusieurs artéfact pour le DPS UNIQUEMENT
     */
    private function calculateATKArtifact(Request $request): int
    {
        $teamCharacter = $this->getSlot1CharacterOfTeam($request);

        $character = Character::where('_id', $teamCharacter['id'])->first();

        if (!$character) {
            throw new \Exception("Personnage non trouvé");
        }

        $artifacts = $character['artifact'];
        $hasATKPercentArtifact = false;
        $totalArtifactBonus = 0;

        $slots = ['slot3', 'slot4', 'slot5'];


        foreach ($slots as $slot) {
            if (!empty($artifacts[$slot]) && isset($artifacts[$slot]['main_stat']) && $artifacts[$slot]['main_stat'] === "ATK%") {
                $hasATKPercentArtifact = true;
                break;
            }
        }

        if ($hasATKPercentArtifact) {
            $baseATK = $character['base_atk'] ?? 0;
            $skillDMG = $character['skill']['elemental_skill']['multiplier'] ?? 0;
            $baseDMG = $baseATK * ($skillDMG / 100);

            foreach ($slots as $slot) {
                if (!empty($artifacts[$slot]) && isset($artifacts[$slot]['main_stat']) && $artifacts[$slot]['main_stat'] === "ATK%") {
                    $bonusATK = $baseDMG * ($artifacts[$slot]['stat_value'] / 100);
                    $totalArtifactBonus += $bonusATK;
                }
            }
        }

        if (!empty($artifacts['slot2'])){
            $totalArtifactBonus += $artifacts['slot2']['stat_value'];
        }

        return intval($totalArtifactBonus);
    }

    private function getCharacterFromSlot(Request $request, string $slot)
    {
        $team = Team::where('_id', $request->team_id)->first();

        if (!$team) {
            throw new \Exception("Équipe non trouvée");
        }

        $character = $team->slots[$slot] ?? null;

        if (!$character) {
            throw new \Exception("Personnage non trouvé dans le slot $slot");
        }

        return $character;
    }

    private function getSlot1CharacterOfTeam(Request $request)
    {
        try {
            $character = $this->getCharacterFromSlot($request, 'slot1');

            if ($character['type'] == "DPS") {
                return $character;
            } else {
                return response()->json([
                    'message' => "Tu n'es pas un DPS dans le slot 1"
                ]);
            }
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage()
            ], 404);
        }
    }
}
