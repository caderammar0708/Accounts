<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

use App\Traits\BelongsToLocation;

class WarrantyClaim extends Model
{
    use HasUuids, BelongsToLocation;

    protected $fillable = [
        'warranty_id',
        'claim_date',
        'odometer_at_claim',
        'issue_description',
        'resolution',
        'resolved_invoice_id',
        'location_id',
    ];

    protected $casts = [
        'claim_date' => 'date',
    ];

    public function warranty()
    {
        return $this->belongsTo(Warranty::class);
    }

    public function resolvedInvoice()
    {
        return $this->belongsTo(\App\Models\Accounting\SalesInvoice::class, 'resolved_invoice_id');
    }
}
