<?php

namespace App\Models\FuelStation;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Company;

class Pump extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'tank_id',
    ];

    public function nozzles()
    {
        return $this->hasMany(Nozzle::class);
    }

    public function tank()
    {
        return $this->belongsTo(Tank::class);
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }
}
