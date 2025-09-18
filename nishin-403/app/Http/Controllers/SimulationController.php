<?php

namespace App\Http\Controllers;

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
            $team = Team::where('_id', $request->team_id)->first();

            if (!$team) {
                return response()->json([
                    'success' => false,
                    'message' => "Équipe non trouvée"
                ], 404);
            }

            $characterData = $team->slots['slot1'] ?? null;

            if (!$characterData) {
                return response()->json([
                    'success' => false,
                    'message' => "Aucun personnage dans le slot1"
                ], 404);
            }

// CALCULS POUR UN DPS ---------------
            if ($characterData['type'] == "DPS") {
                $baseATK = $characterData['base_atk'];
                $skillDMG = $characterData['skill']['elemental_skill']['multiplier'];
                $baseDMG = $baseATK * ($skillDMG / 100);

                return number_format($baseDMG);
// CAS D'ERREUR ------------------
            } else if ($characterData['type'] == "SUPPORT") {
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








    /**
     * Application d'un buff
     */
    private function applyBuff(array $stats, array $buff)
    {
        $statType = $buff['type'];
        $value = $buff['value'];

        if (str_contains($statType, '_percent')) {
            $stats[$statType] += $value;
        } else {
            $stats[$statType] += $value;
        }

        return $stats;
    }


// PRIVATE ------------------------------
    /*
     * Calcule les dégats de un ou plusieurs artéfact pour le DPS UNIQUEMENT
     */
    private function calculateATKArtifact(Request $request): int
    {
        $character = $this->getSlot1CharacterOfTeam($request);

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


    private function getSlot1CharacterOfTeam(Request $request)
    {
        $team = Team::where('_id', $request->team_id)->first();

        $character = $team->slots["slot1"] ?? null;

        if (!$character) {
            throw new \Exception("Personnage non trouvé");
        }

        if ($character['type'] == "DPS") {
            return $character;
        } else {
            return response()->json([
                "Tu n'es pas un DPS dans le slot 1 :",
                $character
            ]);
        }
    }
}
