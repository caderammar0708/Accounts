<?php

namespace App\Models\Accounting;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Models\Supplier;
use OwenIt\Auditing\Contracts\Auditable;

use App\Traits\BelongsToLocation;
use App\Traits\HasAttachments;

class Bill extends Model implements Auditable
{
    use HasUuids, \OwenIt\Auditing\Auditable, BelongsToLocation, HasAttachments;

    protected $fillable = [
        'currency_id',
        'exchange_rate',
        'supplier_id', 'email', 'bill_date',
        'due_date', 'bill_no', 'total_amount', 'memo', 'status', 'voided_at', 'location_id',
    ];

    public function items()
    {
        return $this->hasMany(BillItem::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
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
