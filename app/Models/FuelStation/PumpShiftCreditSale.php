<?php

namespace App\Models\FuelStation;

use Illuminate\Database\Eloquent\Model;

use App\Models\Customer;

class PumpShiftCreditSale extends Model
{
    protected $fillable = [
        'pump_shift_id',
        'customer_id',
        'description',
        'amount',
    ];

    public function pumpShift()
    {
        return $this->belongsTo(PumpShift::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }
}
