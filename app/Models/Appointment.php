<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Appointment extends Model
{
    protected $table = 'appointments';
<<<<<<< HEAD

    protected $primaryKey = 'id';

    public $incrementing = false;

    protected $keyType = 'string';

=======
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';
>>>>>>> OAuth-Ricardo
    public $timestamps = false;

    protected $fillable = [
        'id',
        'barbershop_id',
        'client_id',
        'barber_id',
        'appointment_date',
        'start_time',
        'end_time',
        'status',
        'notes',
        'created_at',
    ];

    public function barbershop()
    {
        return $this->belongsTo(Barbershop::class, 'barbershop_id', 'id');
    }

    public function client()
    {
        return $this->belongsTo(User::class, 'client_id', 'id');
    }

    public function barber()
    {
        return $this->belongsTo(User::class, 'barber_id', 'id');
    }

    public function services()
    {
        return $this->belongsToMany(Service::class, 'appointment_services', 'appointment_id', 'service_id');
    }
}
