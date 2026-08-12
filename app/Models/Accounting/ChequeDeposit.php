<?php

namespace App\Models\Accounting;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use OwenIt\Auditing\Contracts\Auditable;

use App\Traits\BelongsToLocation;

class ChequeDeposit extends Model implements Auditable
{
    use HasUuids, \OwenIt\Auditing\Auditable, BelongsToLocation;

    protected $fillable = [
        'deposit_no',
        'deposit_date',
        'deposit_to_account_id',
        'total_amount',
        'memo',
        'status',
        'location_id',
    ];

    public function items()
    {
        return $this->hasMany(ChequeDepositItem::class);
    }

    public function depositToAccount()
    {
        return $this->belongsTo(ChartOfAcc::class, 'deposit_to_account_id');
    }
}
