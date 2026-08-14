<?php

namespace App\Models\Accounting;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Models\Customer;
use App\Models\Vehicle;
use OwenIt\Auditing\Contracts\Auditable;

class SalesInvoice extends Model implements Auditable
{
    use HasUuids, \OwenIt\Auditing\Auditable;

    protected $fillable = [
        'created_by',
        'receipt_no', 'customer_id', 'email', 'receipt_date', 'payment_method_id',
        'deposit_to_account_id', 'total_amount', 'memo', 'statement_message', 'status',
        'vehicle_id', 'check_date', 'check_number', 'discount_type', 'discount_value', 'prefix', 'memo_on_statement',
    ];

    public function items()
    {
        return $this->hasMany(SalesInvoiceItem::class);
    }

    protected static function booted()
    {
        static::creating(function ($model) {
            if (empty($model->created_by)) {
                $model->created_by = auth()->id();
            }
        });
    }

    public function depositToAccount()
    {
        return $this->belongsTo(ChartOfAcc::class, 'deposit_to_account_id');
    }

    public function company()
    {
        return $this->belongsTo(\App\Models\Company::class);
    }

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class, 'vehicle_id');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function journalEntry()
    {
        return $this->morphOne(JournalEntry::class, 'transactionable');
    }
}
