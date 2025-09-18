<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Character extends Model
{
    protected $connection = 'mongodb';

    protected $collection = 'characters';

    protected $fillable = [
        'name',
        'image',
        'base_atk',
        'elemental_mastery',
        'base_hp',
        'type',
        'skill',
        'vision',
        'buff',
        'artifact',
        'slot',
        'elemental_bonus'
    ];

    protected $casts = [
        'skill' => 'array',
        'buff' => 'array',
        'name' => 'string',
        'image' => 'string',
        'base_atk' => 'integer',
        'elemental_mastery' => 'integer',
        'base_hp' => 'integer',
        'type' => 'string',
        'vision' => 'string',
        'artifact' => 'array',
        'slot' => 'integer',
        'elemental_bonus' => 'integer'
    ];

}
