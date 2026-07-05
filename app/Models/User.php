<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable
{
    protected $table = 'users';

    protected $primaryKey = 'id';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $fillable = [
        'id',
        'full_name',
        'email',
        'phone',
        'avatar_url',
    ];

    public function barbershopMemberships()
    {
        return $this->hasMany(BarbershopMember::class, 'user_id', 'id');
    }

    public function activeBarbershopMembership()
    {
        return $this->hasOne(BarbershopMember::class, 'user_id', 'id')
            ->where('status', 'active');
    }
}