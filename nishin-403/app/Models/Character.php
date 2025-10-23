<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;
use MongoDB\Laravel\Eloquent\SoftDeletes;

class Character extends Model
{
    use SoftDeletes;


    protected $connection = 'mongodb';

    protected $collection = 'characters';

    protected $dates = ['deleted_at'];

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
