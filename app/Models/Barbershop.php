<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Barbershop extends Model
{
    protected $table = 'barbershops';

    protected $primaryKey = 'id';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $fillable = [
        'id',
        'name',
        'slug',
        'description',
        'logo_url',
        'address',
        'phone',
        'email',
        'invite_code',
        'is_active',
        'created_at',
        'updated_at',
    ];

    public function members()
    {
        return $this->hasMany(BarbershopMember::class, 'barbershop_id', 'id');
    }

    public function services()
    {
        return $this->hasMany(Service::class, 'barbershop_id', 'id');
    }

    public function products()
    {
        return $this->hasMany(Product::class, 'barbershop_id', 'id');
    }
}