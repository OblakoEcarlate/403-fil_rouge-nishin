<?php

namespace Database\Seeders;

use App\Models\Character;
use Illuminate\Database\Seeder;

class CharacterSeeder extends Seeder
{
    public function run(): void
    {
    // ************************************* DPS
        // YANFEI DPS
        Character::create([
            'name' => 'Yanfei',
            'image' => 'yanfei.png',
            'base_atk' => 263,
            'elemental_mastery' => 0,
            'base_hp' => 9352,
            'vision' => 'pyro',
            'type' => "DPS",
            'buff' => [],
            'artifact' => [
                'slot1' => [
                    "stat_name" => "HP",
                    "stat_value" => 4780,
                ],
                'slot2' => [
                    "stat_name" => "ATK",
                    "stat_value" => 311,
                ],
                'slot3' => [],
                'slot4' => [],
                'slot5' => []
            ],
            'skill' => [
                'elemental_skill' => [
                    'name' => 'Signed Edict',
                    'multiplier' => 325
                ],
            ],
            'elemental_bonus' => 0,
            'slot' => 1,
        ]);

//        YOIMIYA DPS
        Character::create([
            'name' => 'Yoimiya',
            'image' => 'kazuha.png',
            'base_atk' => 346,
            'elemental_mastery' => 0,
            'base_hp' => 10164,
            'vision' => 'pyro',
            'type' => "DPS",
            'buff' => [],
            'artifact' => [
                'slot1' => [],
                'slot2' => [],
                'slot3' => [],
                'slot4' => [],
                'slot5' => []
            ],
            'skill' => [
                'elemental_skill' => [
                    'name' => 'je sais pas',
                    'multiplier' => 248
                ],
            ],
            'elemental_bonus' => 0,
            'slot' => 0,
        ]);

        //        AYATO DPS
        Character::create([
            'name' => 'Ayato',
            'image' => 'kazuha.png',
            'base_atk' => 322,
            'elemental_mastery' => 0,
            'base_hp' => 13715,
            'vision' => 'hydro',
            'type' => "DPS",
            'buff' => [],
            'artifact' => [
                'slot1' => [],
                'slot2' => [],
                'slot3' => [],
                'slot4' => [],
                'slot5' => []
            ],
            'skill' => [
                'elemental_skill' => [
                    'name' => 'je sais pas',
                    'multiplier' => 192
                ],
            ],
            'elemental_bonus' => 0,
            'slot' => 0,
        ]);

        //        NEUVILLETTE DPS
        Character::create([
            'name' => 'Neuvillette',
            'image' => 'kazuha.png',
            'base_atk' => 231,
            'elemental_mastery' => 0,
            'base_hp' => 14695,
            'vision' => 'hydro',
            'type' => "DPS",
            'buff' => [],
            'artifact' => [
                'slot1' => [],
                'slot2' => [],
                'slot3' => [],
                'slot4' => [],
                'slot5' => []
            ],
            'skill' => [
                'elemental_skill' => [
                    'name' => 'je sais pas',
                    'multiplier' => 1110
                ],
            ],
            'elemental_bonus' => 0,
            'slot' => 0,
        ]);

        //        GANYU DPS
        Character::create([
            'name' => 'Ganyu',
            'image' => 'kazuha.png',
            'base_atk' => 358,
            'elemental_mastery' => 0,
            'base_hp' => 9797,
            'vision' => 'cryo',
            'type' => "DPS",
            'buff' => [],
            'artifact' => [
                'slot1' => [],
                'slot2' => [],
                'slot3' => [],
                'slot4' => [],
                'slot5' => []
            ],
            'skill' => [
                'elemental_skill' => [
                    'name' => 'je sais pas',
                    'multiplier' => 278
                ],
            ],
            'elemental_bonus' => 0,
            'slot' => 0,
        ]);

        //        AYAKA DPS
        Character::create([
            'name' => 'Ayaka',
            'image' => 'kazuha.png',
            'base_atk' => 365,
            'elemental_mastery' => 0,
            'base_hp' => 12858,
            'vision' => 'cryo',
            'type' => "DPS",
            'buff' => [],
            'artifact' => [
                'slot1' => [],
                'slot2' => [],
                'slot3' => [],
                'slot4' => [],
                'slot5' => []
            ],
            'skill' => [
                'elemental_skill' => [
                    'name' => 'je sais pas',
                    'multiplier' => 513
                ],
            ],
            'elemental_bonus' => 0,
            'slot' => 0,
        ]);

        // ************************************* SUPPORT
        // BENNETT SUPPORT
        Character::create([
            'name' => 'Bennett',
            'image' => 'yanfei.png',
            'base_atk' => 214,
            'elemental_mastery' => 0,
            'base_hp' => 12397,
            'vision' => 'pyro',
            'type' => "SUPPORT",
            'buff' => [
                'name' => '+40% ATQ',
                'type' => 'atk_buff',
                'value' => 0.4,
                'is_percentage' => true,
            ],
            'artifact' => [
                'slot1' => [],
                'slot2' => [],
                'slot3' => [],
                'slot4' => [],
                'slot5' => []
            ],
            'skill' => [],
            'elemental_bonus' => 0,
            'slot' => 0,
        ]);

        // CITLALI SUPPORT
        Character::create([
            'name' => 'Citlali',
            'image' => 'yanfei.png',
            'base_atk' => 150,
            'elemental_mastery' => 115,
            'base_hp' => 11634,
            'vision' => 'cryo',
            'type' => "SUPPORT",
            'buff' => [
                'name' => '+20% Dégâts PYRO et HYDRO',
                'type' => 'elemental_buff',
                'value' => 0.2,
                'is_percentage' => true,
            ],
            'artifact' => [
                'slot1' => [],
                'slot2' => [],
                'slot3' => [],
                'slot4' => [],
                'slot5' => []
            ],
            'skill' => [],
            'elemental_bonus' => 0,
            'slot' => 0,
        ]);

        // DIONA SUPPORT
        Character::create([
            'name' => 'Diona',
            'image' => 'yanfei.png',
            'base_atk' => 235,
            'elemental_mastery' => 0,
            'base_hp' => 9570,
            'vision' => 'cryo',
            'type' => "SUPPORT",
            'buff' => [
                'name' => '+200 ME',
                'type' => 'elemental_mastery_buff',
                'value' => 200,
                'is_percentage' => false,
            ],
            'artifact' => [
                'slot1' => [],
                'slot2' => [],
                'slot3' => [],
                'slot4' => [],
                'slot5' => []
            ],
            'skill' => [],
            'elemental_bonus' => 0,
            'slot' => 0,
        ]);

        // Furina SUPPORT
        Character::create([
            'name' => 'Furina',
            'image' => 'yanfei.png',
            'base_atk' => 267,
            'elemental_mastery' => 0,
            'base_hp' => 15307,
            'vision' => 'hydro',
            'type' => "SUPPORT",
            'buff' => [
                'name' => '+ATQ% en fonction des PV de Furina',
                'type' => 'atk_buff',
                'value' => 0.01,
                'is_percentage' => true,
            ],
            'artifact' => [
                'slot1' => [],
                'slot2' => [],
                'slot3' => [],
                'slot4' => [],
                'slot5' => []
            ],
            'skill' => [],
            'elemental_bonus' => 0,
            'slot' => 0,
        ]);

        // KAZUHA SUPPORT
        Character::create([
            'name' => 'Kazuha',
            'image' => 'yanfei.png',
            'base_atk' => 320,
            'elemental_mastery' => 115,
            'base_hp' => 13348,
            'vision' => 'anemo',
            'type' => "SUPPORT",
            'buff' => [
                'name' => '+30% Dégâts élémentaires',
                'type' => 'elemental_buff',
                'value' => 0.3,
                'is_percentage' => true,
            ],
            'artifact' => [
                'slot1' => [],
                'slot2' => [],
                'slot3' => [],
                'slot4' => [],
                'slot5' => []
            ],
            'skill' => [],
            'elemental_bonus' => 0,
            'slot' => 0,
        ]);

        // SUCROSE SUPPORT
        Character::create([
            'name' => 'Sucrose',
            'image' => 'yanfei.png',
            'base_atk' => 193,
            'elemental_mastery' => 0,
            'base_hp' => 9244,
            'vision' => 'anemo',
            'type' => "SUPPORT",
            'buff' => [
                'name' => '+ME en fonction de Sucrose',
                'type' => 'elemental_mastery_buff',
                'value' => 1,
                'is_percentage' => false,
            ],
            'artifact' => [
                'slot1' => [],
                'slot2' => [],
                'slot3' => [],
                'slot4' => [],
                'slot5' => []
            ],
            'skill' => [],
            'elemental_bonus' => 0,
            'slot' => 0,
        ]);

        // XIANGLING SUPPORT
        Character::create([
            'name' => 'Xiangling',
            'image' => 'yanfei.png',
            'base_atk' => 248,
            'elemental_mastery' => 96,
            'base_hp' => 10875,
            'vision' => 'pyro',
            'type' => "SUPPORT",
            'buff' => [],
            'artifact' => [
                'slot1' => [],
                'slot2' => [],
                'slot3' => [],
                'slot4' => [],
                'slot5' => []
            ],
            'skill' => [],
            'elemental_bonus' => 0,
            'slot' => 0,
        ]);
    }
}
