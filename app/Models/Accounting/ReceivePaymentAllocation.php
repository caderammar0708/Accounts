<?php

namespace App\Models\Accounting;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ReceivePaymentAllocation extends Model
{
    use HasUuids;

    protected $fillable = [
        'receive_payment_id', 'credit_invoice_id', 'amount'
    ];

    public function invoice()
    {
        return $this->belongsTo(CreditInvoice::class, 'credit_invoice_id');
    }

    public function payment()
    {
        return $this->belongsTo(ReceivePayment::class, 'receive_payment_id');
    }
}
