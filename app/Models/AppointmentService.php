<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppointmentService extends Model
{
    protected $table = 'appointment_services';
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
        'appointment_id',
        'service_id',
    ];
<<<<<<< HEAD

    public function appointment()
    {
        return $this->belongsTo(Appointment::class, 'appointment_id', 'id');
    }

    public function service()
    {
        return $this->belongsTo(Service::class, 'service_id', 'id');
    }
=======
>>>>>>> OAuth-Ricardo
}
