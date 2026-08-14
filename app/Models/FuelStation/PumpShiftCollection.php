<?php

namespace App\Models\FuelStation;

use Illuminate\Database\Eloquent\Model;

class PumpShiftCollection extends Model
{
    protected $fillable = [
        'pump_shift_id',
        'chart_of_acc_id',
        'description',
        'amount',
    ];

    public function pumpShift()
    {
        return $this->belongsTo(PumpShift::class);
    }

    public function account()
    {
        return $this->belongsTo(ChartOfAcc::class, 'chart_of_acc_id');
    }
}
