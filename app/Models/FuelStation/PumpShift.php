<?php

namespace App\Models\FuelStation;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Models\Employee;
class PumpShift extends Model
{
    use HasUuids;

    protected $fillable = [
        'employee_id',
        'start_time',
        'end_time',
        'status',
        'total_sales_value',
        'discrepancy'
    ];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function shiftNozzles()
    {
        return $this->hasMany(PumpShiftNozzle::class);
    }

    public function collections()
    {
        return $this->hasMany(PumpShiftCollection::class);
    }

    public function creditSales()
    {
        return $this->hasMany(PumpShiftCreditSale::class);
    }
}
