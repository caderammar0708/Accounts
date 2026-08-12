<?php

namespace App\Models\Accounting;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use OwenIt\Auditing\Contracts\Auditable;
use App\Models\Customer;

use App\Traits\BelongsToLocation;

class CreditInvoice extends Model implements Auditable
{
    use HasUuids, \OwenIt\Auditing\Auditable, BelongsToLocation;

    protected $fillable = [
        'customer_id', 'email', 'billing_address', 'shipping_address',
        'terms', 'invoice_date', 'due_date', 'invoice_no', 'total_amount',
        'memo', 'statement_message', 'status', 'discount_type', 'discount_value', 'prefix', 'memo_on_statement',
        'location_id',
    ];

    public function items()
    {
        return $this->hasMany(CreditInvoiceItem::class);
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
