<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

use App\Traits\BelongsToLocation;

class JobCard extends Model
{
    use HasUuids, BelongsToLocation;

    protected $fillable = [
        'customer_id',
        'device_id',
        'job_card_number',
        'service_date',
        'complaint',
        'technician_assigned',
        'estimated_delivery_date',
        'estimated_cost',
        'photos',
        'customer_signature',
        'status',
        'location_id',
    ];

    protected $casts = [
        'service_date' => 'date',
        'estimated_delivery_date' => 'date',
        'estimated_cost' => 'decimal:2',
        'photos' => 'array',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function device()
    {
        return $this->belongsTo(Device::class);
    }
}
