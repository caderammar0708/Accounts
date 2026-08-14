<?php

namespace App\Models\FuelStation;

use Illuminate\Database\Eloquent\Model;

class PumpShiftNozzle extends Model
{
    protected $fillable = [
        'pump_shift_id',
        'nozzle_id',
        'opening_reading',
        'closing_reading',
        'price_per_liter',
        'volume_sold',
        'total_value'
    ];

    public function pumpShift()
    {
        return $this->belongsTo(PumpShift::class);
    }

    public function nozzle()
    {
        return $this->belongsTo(Nozzle::class);
    }
}
