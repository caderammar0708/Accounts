<?php

namespace App\Models\Accounting;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use OwenIt\Auditing\Contracts\Auditable;
use App\Models\Supplier;

use App\Traits\BelongsToLocation;

class BillPayment extends Model implements Auditable
{
    use HasUuids, \OwenIt\Auditing\Auditable, BelongsToLocation;

    protected $fillable = [
        'currency_id',
        'exchange_rate',
        'supplier_id', 'amount', 'payment_date',
        'payment_method_id', 'payment_account_id', 'reference_no', 'memo', 'check_date', 'check_number', 'location_id',
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function account()
    {
        return $this->belongsTo(ChartOfAcc::class, 'payment_account_id');
    }

    public function paymentMethod()
    {
        return $this->belongsTo(PaymentMethod::class);
    }

    public function allocations()
    {
        return $this->hasMany(BillPaymentAllocation::class);
    }

    public function company()
    {
        return $this->belongsTo(\App\Models\Company::class);
    }
}
