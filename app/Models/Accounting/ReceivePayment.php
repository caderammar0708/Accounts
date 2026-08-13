<?php

namespace App\Models\Accounting;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Models\Customer;
use OwenIt\Auditing\Contracts\Auditable;

class ReceivePayment extends Model implements Auditable
{
    use HasUuids, \OwenIt\Auditing\Auditable;

    protected $fillable = [
        'customer_id', 'amount', 'payment_date',
        'payment_method_id', 'deposit_to_account_id', 'reference_no', 'memo',
        'check_date', 'check_number', 'cheque_deposit_id'
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
