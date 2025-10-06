<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use MongoDB\Laravel\Eloquent\Model;
use MongoDB\Laravel\Relations\EmbedsMany;
use MongoDB\Laravel\Relations\EmbedsOne;

class Team extends Model
{
    use HasFactory;

    protected $connection = 'mongodb';

    protected $collection = 'teams';

    protected $fillable = [
        'slots',
        'user_id'
    ];

    protected $attributes = [
        'slots' => [
            'slot1' => null,
            'slot2' => null,
            'slot3' => null,
            'slot4' => null
        ]
    ];

    public function character(): EmbedsMany
    {
        return $this->embedsMany(Character::class);
    }

    public function user(): EmbedsOne
    {
        return $this->embedsOne(User::class);
    }

    public function isSlotAvailable(string $slot): bool
    {
        return empty($this->slots[$slot]);
    }

//    TODO : voir si je laisse toutes ces choses dans le slot
    public function assignToSlot(string $slot, Character $character): void
    {
        $slots = $this->slots ?? [];
        $slots[$slot] = [
            '_id' => $character->_id,
            'name' => $character->name,
            'type' => $character->type,
            'image' => $character->image,
            'base_atk' => $character->base_atk,
            'elemental_mastery' => $character->elemental_mastery,
            'base_hp' => $character->base_hp,
            'skill' => $character->skill,
            'vision' => $character->vision,
            'buff' => $character->buff,
            'artifact' => $character->artifact,
            'slot' => $character->slot,
            'elemental_bonus' => $character->elemental_bonus
        ];
        $this->slots = $slots;
    }

    public function unassignFromSlot(string $slot, Character $character): void
    {
        $slots = $this->slots ?? [];

        if (isset($slots[$slot]) && isset($slots[$slot]['id']) && $slots[$slot]['id'] == $character->_id) {
            unset($slots[$slot]);

            $this->slots = $slots;
        }
    }



}
