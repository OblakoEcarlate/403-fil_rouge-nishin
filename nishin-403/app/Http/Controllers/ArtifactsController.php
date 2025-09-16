<?php

namespace App\Http\Controllers;

use App\Models\Artifact;
use App\Models\Character;
use Illuminate\Http\Request;

class ArtifactsController extends Controller
{
    /**
     *  ARTIFACTS -----
     */
    public function getArtifactsStats(Request $request): array
    {
        $character = Character::where('_id', $request->character_id)->first();

        if (!$character) {
            return [
                'slot1' => [],
                'slot2' => [],
                'slot3' => [],
                'slot4' => [],
                'slot5' => []
            ];
        }

        return array(
            'slot1' => $character->artifact['slot1'],
            'slot2' => $character->artifact['slot2'],
            'slot3' => $character->artifact['slot3'],
            'slot4' => $character->artifact['slot4'],
            'slot5' => $character->artifact['slot5']
        );
    }

    public function addArtifact(Request $request): array
    {
        $character = Character::where('_id', $request->character_id)->first();

        if (!$character) {
            throw new \Exception("Personnage non trouvé");
        }

        $slot = $request->input('slot');
        if (!in_array($slot, ['slot1', 'slot2', 'slot3', 'slot4', 'slot5'])) {
            throw new \Exception("Slot invalide");
        }

        $artifact = $character->artifact ?? [];

        if (!empty($artifact[$slot])) {
            throw new \Exception("Le slot $slot est déjà occupé");
        }

        $availableStats = $this->getAvailableArtifactStats();
        $artifactMainStat = $request->input('main_stat');

        if (!isset($availableStats[$slot][$artifactMainStat])) {
            throw new \Exception("Statistique principale invalide pour le slot $slot");
        }

        $artifact[$slot] = [
            'main_stat' => $request->input('main_stat'),
            'stat_value' => $availableStats[$slot][$request->input('main_stat')]['stat_value']
        ];

        $character->artifact = $artifact;
        $character->save();

        return $character->artifact;
    }


    public function removeArtifact(Request $request): array
    {
        $character = Character::where('_id', $request->character_id)->first();

        if (!$character) {
            throw new \Exception("Personnage non trouvé");
        }

        $slot = $request->input('slot');
        if (!in_array($slot, ['slot1', 'slot2', 'slot3', 'slot4', 'slot5'])) {
            throw new \Exception("Slot invalide");
        }

        $artifact = $character->artifact ?? [
            'slot1' => [], 'slot2' => [], 'slot3' => [], 'slot4' => [], 'slot5' => []
        ];

        if (empty($artifact[$slot])) {
            throw new \Exception("Le slot $slot est déjà vide");
        }

        $artifact[$slot] = [];

        $character->artifact = $artifact;
        $character->save();

        return $character->artifact;
    }


/*
* PRIVATE FUNCTION -------------------------------------------------------
*/
    private function getAvailableArtifactStats(): array
    {
        return [
            'slot1' => [
                'HP' => ['stat_name' => 'HP', 'stat_value' => 4780]
            ],
            'slot2' => [
                'ATK' => ['stat_name' => 'ATK', 'stat_value' => 311]
            ],
            'slot3' => [
                'HP%' => ['stat_name' => 'HP%', 'stat_value' => 46],
                'ATK%' => ['stat_name' => 'ATK%', 'stat_value' => 46],
                'EM' => ['stat_name' => 'Elemental Mastery', 'stat_value' => 187]
            ],
            'slot4' => [
                'HP%' => ['stat_name' => 'HP%', 'stat_value' => 46],
                'ATK%' => ['stat_name' => 'ATK%', 'stat_value' => 46],
                'EM' => ['stat_name' => 'Elemental Mastery', 'stat_value' => 187],
                'Elemental' => ['stat_name' => 'Elemental DMG Bonus', 'stat_value' => 46]
            ],
            'slot5' => [
                'HP%' => ['stat_name' => 'HP%', 'stat_value' => 46],
                'ATK%' => ['stat_name' => 'ATK%', 'stat_value' => 46],
                'EM' => ['stat_name' => 'Elemental Mastery', 'stat_value' => 187]
            ]
        ];
    }

}
