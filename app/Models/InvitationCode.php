<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InvitationCode extends Model
{
    protected $table = 'invitation_codes';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'id',
        'barbershop_id',
        'code',
        'expires_at',
        'is_active',
        'created_at',
    ];

    public function barbershop()
    {
        return $this->belongsTo(Barbershop::class, 'barbershop_id', 'id');
    }
}
