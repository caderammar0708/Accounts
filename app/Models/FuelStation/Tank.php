<?php

namespace App\Models\FuelStation;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Item;
use App\Models\Company;

class Tank extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'item_id',
        'capacity',
        'min_level',
        'current_stock',
    ];

    public function fuel_type()
    {
        return $this->belongsTo(Item::class, 'item_id');
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function nozzles()
    {
        return $this->hasMany(Nozzle::class);
    }
}
