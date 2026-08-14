<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use App\Traits\BelongsToLocation;

class Vehicle extends Model
{
    use BelongsToLocation;

    protected $fillable = [
        'vehicle_type',
        'brand',
        'model',
        'fuel_type',
        'customer_id',
        'vehicle_no',
        'location_id',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }
}
