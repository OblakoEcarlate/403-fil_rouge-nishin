<?php

namespace Tests\Feature;

use Tests\TestCase;
use Mockery;
use Illuminate\Http\Request;
use App\Http\Controllers\TeamController;
use App\Models\Team;
use App\Models\Character;

/**
 * Tests d’intégration complets du TeamController
 */
class TeamTest extends TestCase
{
    protected TeamController $controller;
    protected Request $request;
    protected FakeDataBuilder $fake;
    protected object $user;
    protected object $team;

    protected function setUp(): void
    {
        parent::setUp();

        // Création du contrôleur mocké
        $this->controller = Mockery::mock(TeamController::class)
            ->makePartial()
            ->shouldAllowMockingProtectedMethods();

        // Création du fake builder
        $this->fake = new FakeDataBuilder();

        // Création d’un utilisateur simulé
        $this->user = $this->fake->fakeUser();

        // Création d’une team vide associée à cet utilisateur
        $this->team = $this->fake->fakeTeam($this->user);

        // Création d’une Request simulée
        $this->request = Request::create('/api/team', 'POST');

        // Attache le faux user à la Request (simulateur de $request->user())
        $this->fake->attachTeamToRequest($this->request, $this->team);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    // public function test_dps_moving_to_slot1_when_add_to_slot_support()
    // {
        
    //     $dps = $this->fake->dpsWithId("68fa70e3e66c597f1e0ad512");

    //     $this->team = $this->fake->fakeTeam($this->user, [
    //         'slot1' => null,
    //         'slot2' => null,
    //         'slot3' => null,
    //         'slot4' => null,
    //     ]);

    //     // dd($this->request);

    //     $this->fake->attachCharToTeamToRequest($this->request, $this->team, $dps->_id, 'slot2');

    //     // dd($this->request->user());
    //     // dd($this->request->user()->team);
    //     // dd($this->request->user()->character_id);
        
    //     $response = $this->controller->addCharacterToSlot($this->request);

    //     // dd($this->request->user()->character_id);
    //     dd($this->request->user());
    //     dd($response);

    //     $this->assertEquals('char_id1', $response->team['slot1'][id]);
    // }

    public function test_add_dps_in_slot2_moves_to_slot1()
    {
        // DPS typé Eloquent (pas de DB)
        $dps = new \App\Models\Character();
        $dps->_id  = 'char_id1';
        $dps->type = 'DPS';
        $dps->name = 'Fake DPS';

        // Mock Team (partiel) avec slots + méthodes
        $team = Mockery::mock(\App\Models\Team::class)->makePartial();
        $team->_id    = 'team_001';
        $team->user_id = $this->user->_id ?? $this->user->id;
        $team->slots  = ['slot1'=>null,'slot2'=>null,'slot3'=>null,'slot4'=>null];

        $team->shouldReceive('isSlotAvailable')->andReturn(true);
        $team->shouldReceive('assignToSlot')
            ->andReturnUsing(function ($slot, $character) use ($team) {
                $slots = $team->slots; // copie locale
                $slots[$slot] = [
                    '_id'  => $character->_id,
                    'type' => $character->type,
                    'name' => $character->name,
                ];
                $team->slots = $slots; // réaffectation complète
            });
        $team->shouldReceive('save')->andReturn(true);
        $team->shouldReceive('getSlotsWithCharacters')->andReturnUsing(fn() => $team->slots);

        // Contrôleur mocké (partiel) qui renvoie la team et "trouve" le perso
        $this->controller->shouldReceive('getTeam')->once()->andReturn($team);
        $this->controller->shouldReceive('findCharacterById')
            ->with('char_id1')
            ->andReturn($dps);

        // Requête + user simulé
        $this->request = Request::create('/api/team', 'POST', [
            'slot' => 'slot2',
            'character_id' => 'char_id1',
        ]);
        // IMPORTANT : que $request->user()->team soit utilisable
        $this->fake->attachTeamToRequest($this->request, $team);

        // Exécution
        $response = $this->controller->addCharacterToSlot($this->request);
        $data = $response->getData(true);

        // Asserts
        $this->assertEquals('char_id1', $data['team']['slots']['slot1']['_id']);
        $this->assertNull($data['team']['slots']['slot2']);
    }

}