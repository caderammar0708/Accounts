<?php

namespace App\Models\Accounting;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Models\Supplier;
use OwenIt\Auditing\Contracts\Auditable;

class Bill extends Model implements Auditable
{
    use HasUuids, \OwenIt\Auditing\Auditable;

    protected $fillable = [
        'supplier_id', 'email', 'bill_date',
        'due_date', 'bill_no', 'total_amount', 'memo', 'status'
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
