<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Team;
use App\Models\Character;
use Tests\TestCase;
use Illuminate\Support\Facades\DB;
use PHPUnit\Framework\Attributes\Test;

class SimulationApiTest extends TestCase
{
    protected User $user;
    protected Team $team;
    protected Character $dps;
    protected Character $support;
    protected Character $support2;
    protected Character $support3;

    protected function setUp(): void
    {
        parent::setUp();

        DB::purge('mongodb');
        DB::connection('mongodb')->reconnect();
        // \DB::connection('mongodb')->getMongoDB()->drop();

        // Nettoyage
        User::truncate();
        Team::truncate();
        Character::truncate();


        $this->user = User::factory()->create();

        $this->dps = Character::factory()->create([
            '_id' => 'dps1',
            'type' => 'DPS',
            'name' => 'Diluc',
            'base_atk' => 200,
            'elemental_mastery' => 80,
            'skill' => ['elemental_skill' => ['multiplier' => 150]],
            'artifact' => [
                'slot2' => ['main_stat' => 'ATK', 'stat_value' => 100],
                'slot3' => ['main_stat' => 'ATK%', 'stat_value' => 20],
                'slot4' => ['main_stat' => 'ATK%', 'stat_value' => 15],
            ],
        ]);

        $this->support = Character::factory()->create([
            '_id' => 'support1',
            'type' => 'SUPPORT',
            'name' => 'Bennett',
            'buff' => [
                'type' => 'atk_buff',
                'value' => 0.2,
                'name' => 'Inspiration'
            ]
        ]);

        $this->support2 = Character::factory()->create([
            '_id' => 'support2',
            'type' => 'SUPPORT',
            'name' => 'Sucrose',
            'buff' => [
                'type' => 'elemental_mastery_buff',
                'value' => 50,
                'name' => 'Catalyse magique'
            ]
        ]);

        $this->support3 = Character::factory()->create([
            '_id' => 'support3',
            'type' => 'SUPPORT',
            'name' => 'Xiangling',
            'buff' => [
                'type' => 'elemental_buff',
                'value' => 0.25,
                'name' => 'Guoba Fury'
            ]
        ]); 

        // 🧩 Crée l'équipe
        $this->team = Team::factory()->create([
            '_id' => 'team1',
            'user_id' => $this->user->id,
            'slots' => [
                'slot1' => $this->dps->_id,
                'slot2' => $this->support->_id,
                'slot3' => $this->support2->_id,
                'slot4' => $this->support3->_id,
            ],
        ]);


        $this->user->team()->save($this->team);

        // dd(Character::find('support1'));
    }

    #[Test]
    public function it_uses_testing_mongo_database()
    {
        $db = DB::connection('mongodb')->getMongoDB()->getDatabaseName();

        dump("Base MongoDB utilisée : " . $db);

        $this->assertSame('genshin_test', $db);
    }

    #[Test]
    public function it_calculates_basic_damage_for_dps(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')->get('/api/simulateBasicDamageForDPS');

        $response->assertOk();
    }

    #[Test]
    public function it_returns_error_if_all_slots_is_empty(): void
    {
        $this->team->update(['slots' => []]);

        $response = $this->actingAs($this->user, 'sanctum')->getJson('/api/simulateBasicDamageForDPS');

        // $response->assertStatus(500)
        //          ->assertJsonStructure(['error', 'message']);
        $response->assertStatus(500);
    }

    #[Test]
    public function it_calculates_damage_with_artifact_bonus(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')->getJson('/api/simulateDamageWithArtifact');

        $response->assertOk();

        $content = $response->baseResponse->getContent();

        // Peut renvoyer un entier ou un JSON
        $this->assertTrue(is_numeric($content) || $this->isJson($content));
    }

    #[Test]
    public function it_applies_buff_from_support_characters(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')->getJson('/api/simulateDamageWithBuffForDPS');

        $response->assertOk()
                 ->assertJsonStructure(['base_atk', 'base_em', 'base_elemental']);
    }

    #[Test]
    public function it_computes_full_damage_with_buff_and_artifact(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')->getJson('/api/simulateDamageForDPS');

        $response->assertOk();

        $content = $response->baseResponse->getContent();
        $this->assertTrue(is_numeric($content) || $this->isJson($content));
    }
}
