<?php

namespace App\Models\Inventory;

use Illuminate\Database\Eloquent\Model;
use App\Models\Accounting\ChartOfAcc;

class StockShiftCollection extends Model
{
    protected $fillable = [
        'stock_shift_id',
        'chart_of_acc_id',
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

    public function chartOfAccount()
    {
        return $this->belongsTo(ChartOfAcc::class, 'chart_of_acc_id');
    }
}
