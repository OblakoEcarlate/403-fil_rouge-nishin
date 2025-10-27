<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Artifact extends Model
{
    use HasFactory;

    protected $collection = 'artifacts';

    protected $fillable = [
        'main_stat',
        'number_slot',
        'name',
        'stat_value',
        'character_id',
        'slot',
    ];

    protected $casts = [
        'name' => 'string',
        'main_stat' => 'integer',
        'number_slot' => 'integer',
    ];
}
