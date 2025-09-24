<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Artifact extends Model
{
    protected $collection = 'artifacts';

    protected $fillable = [
        'main_stat',
        'number_slot',
        'name',
    ];

    protected $casts = [
        'name' => 'string',
        'main_stat' => 'integer',
        'number_slot' => 'integer',
    ];
}
