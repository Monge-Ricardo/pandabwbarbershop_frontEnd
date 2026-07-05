<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Availability extends Model
{
    protected $table = 'availability';

    protected $primaryKey = 'id';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $fillable = [
        'id',
        'barbershop_id',
        'barber_id',
        'day_of_week',
        'start_time',
        'end_time',
        'is_available',
    ];

    public function barbershop()
    {
        return $this->belongsTo(Barbershop::class, 'barbershop_id', 'id');
    }

    public function barber()
    {
        return $this->belongsTo(User::class, 'barber_id', 'id');
    }
}
