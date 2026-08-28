<?php

namespace App\Models\Accounting;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Models\Customer;
use OwenIt\Auditing\Contracts\Auditable;

use App\Traits\BelongsToLocation;
use App\Traits\HasAttachments;

class ReceivePayment extends Model implements Auditable
{
    use HasUuids, \OwenIt\Auditing\Auditable, BelongsToLocation, HasAttachments;

    protected $fillable = [
        'currency_id',
        'exchange_rate',
        'customer_id', 'amount', 'payment_date',
        'payment_method_id', 'deposit_to_account_id', 'reference_no', 'memo',
        'check_date', 'check_number', 'cheque_deposit_id', 'location_id',
        'status', 'voided_at',
    ];

    public function chequeDeposit()
    {
        return $this->belongsTo(ChequeDeposit::class);
    }

    public function allocations()
    {
        return $this->hasMany(ReceivePaymentAllocation::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function company()
    {
        return $this->belongsTo(\App\Models\Company::class);
    }

    public function journalEntry()
    {
        return $this->morphOne(JournalEntry::class, 'transactionable');
    }
}
