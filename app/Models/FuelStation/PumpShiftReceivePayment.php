<?php

namespace App\Models\FuelStation;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

class PumpShiftReceivePayment extends Model
{
    use HasUuids;

    protected $fillable = [
        'pump_shift_id',
        'customer_id',
        'description',
        'amount',
    ];

    public function customer()
    {
        return $this->belongsTo(\App\Models\Customer::class);
    }
}
