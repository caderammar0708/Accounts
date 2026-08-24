<?php

namespace App\Models\Inventory;

use Illuminate\Database\Eloquent\Model;
use App\Models\Item;

class StockShiftItem extends Model
{
    protected $fillable = [
        'stock_shift_id',
        'item_id',
        'issued_qty',
        'returned_qty',
        'sold_qty',
        'unit_price',
        'total_value'
    ];

    protected $casts = [
        'issued_qty' => 'float',
        'returned_qty' => 'float',
        'sold_qty' => 'float',
        'unit_price' => 'float',
        'total_value' => 'float',
    ];

    public function stockShift()
    {
        return $this->belongsTo(StockShift::class);
    }

    public function item()
    {
        return $this->belongsTo(Item::class);
    }
}
