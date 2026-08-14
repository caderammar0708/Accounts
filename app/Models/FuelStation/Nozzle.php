<?php

namespace App\Models\FuelStation;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Nozzle extends Model
{
    use HasFactory;

    protected $fillable = [
        'pump_id',
        'name',
        'order_no',
        'tank_id',
    ];

    public function pump()
    {
        return $this->belongsTo(Pump::class);
    }

    public function tank()
    {
        return $this->belongsTo(Tank::class);
    }
}
