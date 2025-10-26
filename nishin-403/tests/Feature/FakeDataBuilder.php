<?php

namespace Tests\Feature;

class FakeDataBuilder
{
    public function fakeUser()
    {
        return (object)[
            '_id' => 'user_123',
            'email' => 'test@user.fr',
        ];
    }

    public function fakeTeam($user, array $slots = [])
    {
        return (object)[
            '_id' => 'team_123',
            'user_id' => $user->_id,
            'slots' => $slots, 
        ];
    }

    /**
     * attache une team à un user, ceux fictif du haut 
     */
    public function attachTeamToRequest($request, $team)
    {
        $request->setUserResolver(fn () => (object)[
            'id' => $team->user_id,
            'user_id' => $team->user_id,
            'team' => $team
        ]);

        return $request;
    }

    // public function attachCharToTeamToRequest($request, $team, $char_id, $slot)
    // {
    //     $request->setUserResolver(fn () => (object)[
    //         'id' => $team->user_id,
    //         'character_id' => $char_id,
    //         'user_id' => $team->user_id,
    //         'slot' => $slot,
    //         'team' => $team,
    //         'slots' => $team->slots
    //     ]);

    //     return $request;
    // }


    /**
     * Crée un personnage DPS de base.
     */
    public function dps(int $baseAtk, int $multiplier, int $em = 0)
    {
        return [
            'type' => 'DPS',
            'base_atk' => $baseAtk,
            'elemental_mastery' => $em,
            'skill' => [
                'elemental_skill' => ['multiplier' => $multiplier],
            ],
        ];
    }


    public function dpsWithId(string $id)
    {
       return (object)[
            'type' => 'DPS',
            '_id' => $id,
        ];
    }

    /**
     * Crée un DPS avec un artefact ATK%.
     */
    public function dpsWithArtifactATKPercent(int $baseAtk, int $multiplier, int $percent): array
    {
        return [
            'type' => 'DPS',
            'base_atk' => $baseAtk,
            'skill' => [
                'elemental_skill' => ['multiplier' => $multiplier],
            ],
            'artifact' => [
                'slot3' => ['main_stat' => 'ATK%', 'stat_value' => $percent],
            ],
        ];
    }

    /**
     * Crée un DPS avec un artefact d’ATK fixe.
     */
    public function dpsWithArtifactFixedATK(int $baseAtk, int $multiplier, int $value): array
    {
        return [
            'type' => 'DPS',
            'base_atk' => $baseAtk,
            'skill' => [
                'elemental_skill' => ['multiplier' => $multiplier],
            ],
            'artifact' => [
                'slot2' => ['main_stat' => 'ATK', 'stat_value' => $value],
            ],
        ];
    }

    /**
     * Crée un personnage support avec un buff donné.
     */
    public function support(string $buffType, float $value): array
    {
        return [
            'type' => 'SUPPORT',
            'buff' => [
                'type' => $buffType,
                'value' => $value,
            ],
        ];
    }

    /**
     * Simule une réponse JSON de la fonction applyBuff()
     */
    public function buffResponse(array $buffs)
    {
        return response()->json([
            'success' => true,
            'buffs' => $buffs,
        ]);
    }
}
