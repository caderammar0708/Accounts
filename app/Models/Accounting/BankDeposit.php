<?php

namespace App\Models\Accounting;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use OwenIt\Auditing\Contracts\Auditable;

use App\Traits\BelongsToLocation;
use App\Traits\HasAttachments;

class BankDeposit extends Model implements Auditable
{
    use HasUuids, \OwenIt\Auditing\Auditable, BelongsToLocation, HasAttachments;

    protected $fillable = [
        'currency_id',
        'exchange_rate',
        'deposit_no', 'deposit_date', 'deposit_to_account_id', 'cash_back_account_id', 'cash_back_memo', 'cash_back_amount', 'total_amount', 'memo', 'status', 'voided_at', 'location_id',
    ];

    public function items()
    {
        return $this->hasMany(BankDepositItem::class);
    }
}
