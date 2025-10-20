<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Laravel\Sanctum\HasApiTokens;
use MongoDB\Laravel\Auth\User as Authenticatable;
use MongoDB\Laravel\Eloquent\HybridRelations;
use MongoDB\Laravel\Eloquent\Model;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory;
    use HybridRelations;
    use HasApiTokens;

    protected $collection = 'users';
    protected $connection = 'mongodb';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'email',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $primaryKey = '_id';
    protected $keyType = 'string';

    public function team()
    {
        return $this->hasOne(Team::class, 'user_id');
    }
}
