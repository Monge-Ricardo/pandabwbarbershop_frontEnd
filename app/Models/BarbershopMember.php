<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BarbershopMember extends Model
{
    protected $table = 'barbershop_members';

    protected $primaryKey = 'id';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $fillable = [
        'id',
        'barbershop_id',
        'user_id',
        'role',
        'status',
        'joined_at',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    public function barbershop()
    {
        return $this->belongsTo(Barbershop::class, 'barbershop_id', 'id');
    }
}