<?php

namespace App\Models\Accounting;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use OwenIt\Auditing\Contracts\Auditable;

use App\Traits\BelongsToLocation;
use App\Traits\HasAttachments;

class Payment extends Model implements Auditable
{
    use HasUuids, \OwenIt\Auditing\Auditable, BelongsToLocation, HasAttachments;

    protected $fillable = [
        'currency_id',
        'exchange_rate',
        'payee_id', 'payee_type', 'payment_account_id',
        'payment_date', 'payment_method_id', 'reference_no',
        'total_amount', 'memo', 'status', 'voided_at', 'check_date', 'check_number', 'location_id',
    ];

    public function items()
    {
        return $this->hasMany(PaymentItem::class);
    }
    public function journalEntry()
    {
        return $this->morphOne(JournalEntry::class, 'transactionable');
    }
}
