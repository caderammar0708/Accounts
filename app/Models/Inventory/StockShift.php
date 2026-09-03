<?php

namespace App\Models\Inventory;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Models\HR\Employee;
use App\Models\Location;

class StockShift extends Model
{
    use HasUuids;

    protected $fillable = [
        'location_id',
        'employee_id',
        'start_time',
        'end_time',
        'status',
        'total_sales_value',
        'cash_collected',
        'credit_sales',
        'transfers_collected',
        'discrepancy',
        'notes'
    ];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
    ];

    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function shiftItems()
    {
        return $this->hasMany(StockShiftItem::class);
    }

    public function collections()
    {
        return $this->hasMany(StockShiftCollection::class);
    }

    public function creditSales()
    {
        return $this->hasMany(StockShiftCreditSale::class);
    }
}
