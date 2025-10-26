<?php

namespace Tests\Feature;

use Tests\TestCase;
use Mockery;
use Illuminate\Http\Request;
use App\Http\Controllers\SimulationController;

/**
 * Tests d’intégration complets du SimulationController
 */
class SimulationIntegrationTest extends TestCase
{
    protected SimulationController $controller;
    protected Request $request;
    protected FakeDataBuilder $fake;
    protected object $user;
    protected object $team;

    protected function setUp(): void
    {
        parent::setUp();

        // Création du contrôleur mocké
        $this->controller = Mockery::mock(SimulationController::class)
            ->makePartial()
            ->shouldAllowMockingProtectedMethods();

        // Création du fake builder
        $this->fake = new FakeDataBuilder();

        // Création d’un utilisateur simulé
        $this->user = $this->fake->fakeUser();

        // Création d’une team vide associée à cet utilisateur
        $this->team = $this->fake->fakeTeam($this->user);

        // Création d’une Request simulée
        $this->request = Request::create('/api/simulate', 'POST');

        // Attache le faux user à la Request (simulateur de $request->user())
        $this->fake->attachTeamToRequest($this->request, $this->team);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    /** 1️⃣ Dégâts de base sans artefacts ni buffs */
    public function test_basic_damage_for_dps()
    {
        $dps = $this->fake->dps(100, 200);
        $this->controller->shouldReceive('getSlot1CharacterOfTeam')->andReturn($dps);

        $result = $this->controller->simulateBasicDamageForDPS($this->request);

        $this->assertEquals(200, $result);
    }

    /** 2️⃣ Dégâts avec artefact ATK% */
    public function test_damage_with_artifact_atk_percent()
    {
        $dps = $this->fake->dpsWithArtifactATKPercent(100, 200, 46);

        $this->controller->shouldReceive('getSlot1CharacterOfTeam')->andReturn($dps);
        $this->controller->shouldReceive('calculateATKArtifact')->andReturn(92);
        $this->controller->shouldReceive('simulateBasicDamageForDPS')->andReturn(200);

        $result = $this->controller->simulateDamageWithArtifact($this->request);
        $this->assertGreaterThan(200, $result);
    }

    /** 3️⃣ Dégâts avec artefact ATK fixe */
    public function test_damage_with_fixed_atk_artifact()
    {
        $dps = $this->fake->dpsWithArtifactFixedATK(100, 200, 46);

        $this->controller->shouldReceive('getSlot1CharacterOfTeam')->andReturn($dps);
        $this->controller->shouldReceive('calculateATKArtifact')->andReturn(46);
        $this->controller->shouldReceive('simulateBasicDamageForDPS')->andReturn(200);

        $result = $this->controller->simulateDamageWithArtifact($this->request);
        $this->assertGreaterThan(200, $result);
    }

    /** 4️⃣ Buff ATK% d’un support */
    public function test_buff_atk_percent_from_support()
    {
        $dps = $this->fake->dps(100, 200);
        $buffResponse = $this->fake->buffResponse([0, 0.25, 0, 0]);

        $this->controller->shouldReceive('getSlot1CharacterOfTeam')->andReturn($dps);
        $this->controller->shouldReceive('applyBuff')->andReturn($buffResponse);
        $this->controller->shouldReceive('simulateBasicDamageForDPS')->andReturn(200);

        $response = $this->controller->simulateDamageWithBuffForDPS($this->request);
        $data = $response->getData(true);

        $this->assertEquals(125, $data['base_atk']); // 100 + 25%
    }

    /** 5️⃣ Buff de maitrise élémentaire (Sucrose) */
    public function test_buff_elemental_mastery_from_sucrose()
    {
        $dps = $this->fake->dps(baseAtk: 100, multiplier: 200, em: 50);
        $buffResponse = $this->fake->buffResponse([180, 0, 0, 0]); // EM total buffé

        $this->controller->shouldReceive('getSlot1CharacterOfTeam')->andReturn($dps);
        $this->controller->shouldReceive('applyBuff')->andReturn($buffResponse);
        $this->controller->shouldReceive('simulateBasicDamageForDPS')->andReturn(200);

        $response = $this->controller->simulateDamageWithBuffForDPS($this->request);
        $data = $response->getData(true);

        $this->assertGreaterThanOrEqual(180, $data['base_em']);
    }

    /** 6️⃣ Buff élémentaire (bonus dégâts%) */
    public function test_elemental_damage_buff()
    {
        $dps = $this->fake->dps(100, 200);
        $buffResponse = $this->fake->buffResponse([0, 0, 0, 0.46]);

        $this->controller->shouldReceive('getSlot1CharacterOfTeam')->andReturn($dps);
        $this->controller->shouldReceive('applyBuff')->andReturn($buffResponse);
        $this->controller->shouldReceive('simulateBasicDamageForDPS')->andReturn(200);

        $response = $this->controller->simulateDamageWithBuffForDPS($this->request);
        $data = $response->getData(true);

        $this->assertGreaterThan(200, $data['base_elemental']);
    }

    /** 7️⃣ Simulation complète (artéfacts + buffs) */
    public function test_full_simulation_with_artifact_and_buffs()
    {
        $dps = $this->fake->dpsWithArtifactATKPercent(100, 200, 46);
        $supportAtk = $this->fake->support('atk_buff', 0.25);
        $supportElemental = $this->fake->support('elemental_buff', 0.46);
        $supportEM = $this->fake->support('elemental_mastery_buff', 0.10);

        $this->team = $this->fake->fakeTeam($this->user, [
            'slot1' => $dps,
            'slot2' => $supportAtk,
            'slot3' => $supportElemental,
            'slot4' => $supportEM,
        ]);

        $this->fake->attachTeamToRequest($this->request, $this->team);

        $this->controller->shouldReceive('getSlot1CharacterOfTeam')
            ->once()
            ->andReturn((array)$dps);

        $this->controller->shouldReceive('simulateBasicDamageForDPS')
            ->once()
            ->andReturn(200); // base_atk 100 * 2

        $this->controller->shouldReceive('simulateDamageWithArtifact')
            ->once()
            ->andReturn(292); // 200 + 46%

        $this->controller->shouldReceive('simulateDamageWithBuffForDPS')
            ->once()
            ->andReturn(response()->json([
                "base_atk" => 125,          // après buff ATK%
                "base_em" => 80,            // buff maitrise
                "base_elemental" => 292 * 1.46, // dégâts élémentaires augmentés
            ]));

        $result = $this->controller->simulateDamageForDPS($this->request);

        $this->assertIsInt($result);
        $this->assertGreaterThan(300, $result, 'Les dégâts totaux devraient dépasser 300.');
    }



    /** 8️⃣ Cas d’erreur : slot1 n’est pas un DPS */
    public function test_error_when_slot1_is_support()
    {
        $support = $this->fake->support('atk_buff', 0.25);
        $this->controller->shouldReceive('getSlot1CharacterOfTeam')->andReturn($support);

        $response = $this->controller->simulateBasicDamageForDPS($this->request);

        $this->assertEquals(500, $response->status());
    }

    /** 9️⃣ Cas d’erreur : slot1 vide */
    public function test_error_when_slot1_is_empty()
    {
        $this->controller->shouldReceive('getSlot1CharacterOfTeam')->andReturn(null);

        $response = $this->controller->simulateDamageWithArtifact($this->request);
        $this->assertEquals(404, $response->status());
    }
    
}
