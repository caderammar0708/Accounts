<?php

namespace App\Models\Inventory;

use Illuminate\Database\Eloquent\Model;
use App\Models\Customer;

class StockShiftCreditSale extends Model
{
    protected $fillable = [
        'stock_shift_id',
        'customer_id',
        'description',
        'amount'
    ];

    protected $casts = [
        'amount' => 'float',
    ];

    public function stockShift()
    {
        return $this->belongsTo(StockShift::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }
}
