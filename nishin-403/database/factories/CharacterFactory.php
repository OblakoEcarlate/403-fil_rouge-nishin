<?php

namespace Database\Factories;

use App\Models\Character;
use Illuminate\Database\Eloquent\Factories\Factory;

class CharacterFactory extends Factory
{
    protected $model = Character::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->firstName,
            'type' => 'DPS',
            'base_atk' => 100,
            'elemental_mastery' => 50,
            'skill' => [
                'elemental_skill' => ['multiplier' => 120]
            ],
            'artifact' => [
                'slot2' => ['main_stat' => 'ATK', 'stat_value' => 100],
                'slot3' => ['main_stat' => 'ATK%', 'stat_value' => 20],
            ],
            'vision' => 'Pyro'
        ];
    }
}
