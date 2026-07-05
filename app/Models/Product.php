<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $table = 'products';

    protected $primaryKey = 'id';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $fillable = [
        'id',
        'barbershop_id',
        'name',
        'description',
        'price',
        'stock',
        'image_url',
        'is_active',
        'created_at',
    ];
}