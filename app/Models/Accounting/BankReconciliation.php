<?php

namespace App\Models\Accounting;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class BankReconciliation extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'company_id',
        'account_id',
        'start_date',
        'end_date',
        'opening_balance',
        'ending_balance',
        'cleared_balance',
        'status',
        'created_by'
    ];

    public function account()
    {
        return $this->belongsTo(ChartOfAcc::class, 'account_id');
    }
}
