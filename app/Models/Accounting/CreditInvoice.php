<?php

namespace App\Models\Accounting;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use OwenIt\Auditing\Contracts\Auditable;
use App\Models\Customer;

use App\Traits\BelongsToLocation;
use App\Traits\HasAttachments;

class CreditInvoice extends Model implements Auditable
{
    use HasUuids, \OwenIt\Auditing\Auditable, BelongsToLocation, HasAttachments;

    protected $fillable = [
        'customer_id', 'email', 'billing_address', 'shipping_address',
        'terms', 'invoice_date', 'due_date', 'invoice_no', 'total_amount',
        'memo', 'statement_message', 'status', 'voided_at', 'discount_type', 'discount_value', 'prefix', 'memo_on_statement',
        'location_id', 'source_id', 'source_type',
    ];

    public function source()
    {
        return $this->morphTo();
    }

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
