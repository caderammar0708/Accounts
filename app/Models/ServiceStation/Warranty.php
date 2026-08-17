<?php

namespace App\Models\ServiceStation;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Carbon\Carbon;
use App\Models\Customer;
use App\Traits\BelongsToLocation;

class Warranty extends Model
{
    use HasUuids, BelongsToLocation;

    protected $fillable = [
        'warranty_policy_id',
        'invoice_item_id',
        'vehicle_id',
        'customer_id',
        'start_date',
        'start_odometer',
        'end_date',
        'end_odometer',
        'status',
        'resolved_invoice_id',
        'location_id',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    protected static function booted()
    {
        static::creating(function ($warranty) {
            $policy = WarrantyPolicy::find($warranty->warranty_policy_id);
            if ($policy) {
                $computed = static::calculateExpiryDates($policy, $warranty->start_date, $warranty->start_odometer);

                if ($computed['end_date'] && !$warranty->end_date) {
                    $warranty->end_date = $computed['end_date'];
                }
                if ($computed['end_odometer'] !== null && !$warranty->end_odometer) {
                    $warranty->end_odometer = $computed['end_odometer'];
                }
            }
        });
    }

    public static function calculateExpiryDates(WarrantyPolicy $policy, ?string $startDate = null, ?int $startOdometer = null): array
    {
        $endDate = null;
        $endOdometer = null;

        if ($policy->duration_days && !in_array($policy->expiry_rule, ['km_only'], true)) {
            $endDate = Carbon::parse($startDate ?? now()->toDateString())->addDays($policy->duration_days)->toDateString();
        }

        if ($policy->duration_km && $startOdometer !== null && in_array($policy->expiry_rule, ['km_only', 'whichever_first'], true)) {
            $endOdometer = $startOdometer + $policy->duration_km;
        }

        return [
            'end_date' => $endDate,
            'end_odometer' => $endOdometer,
        ];
    }

    public function warrantyPolicy()
    {
        return $this->belongsTo(WarrantyPolicy::class);
    }

    public function invoiceItem()
    {
        return $this->belongsTo(\App\Models\Accounting\SalesInvoiceItem::class, 'invoice_item_id');
    }

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function claims()
    {
        return $this->hasMany(WarrantyClaim::class);
    }

    public function isExpired(): bool
    {
        $policy = $this->warrantyPolicy;
        if (!$policy) {
            return false;
        }

        $now = Carbon::now();
        $dateExpired = $policy->expiry_rule !== 'km_only' && $this->end_date && Carbon::parse($this->end_date)->isPast();

        if ($policy->expiry_rule === 'days_only') {
            return $dateExpired;
        }

        if ($policy->expiry_rule === 'km_only') {
            if (!$this->end_odometer || !$this->vehicle?->latest_odometer) {
                return false;
            }
            return $this->vehicle->latest_odometer >= $this->end_odometer;
        }

        // whichever_first
        if ($policy->expiry_rule === 'whichever_first') {
            if ($dateExpired) {
                return true;
            }
            if ($this->end_odometer && $this->vehicle?->latest_odometer) {
                return $this->vehicle->latest_odometer >= $this->end_odometer;
            }
        }

        return false;
    }
}
