<?php

namespace App\Models\Accounting;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use OwenIt\Auditing\Contracts\Auditable;

use App\Traits\BelongsToLocation;
use App\Traits\HasAttachments;

class InventoryQuantityAdjustment extends Model implements Auditable
{
    use HasUuids, \OwenIt\Auditing\Auditable, BelongsToLocation, HasAttachments;

    protected $fillable = [
        'adjustment_date',
        'reference_number',
        'adjustment_reason',
        'inventory_adjustment_account_id',
        'memo',
        'location_id',
        'status',
        'voided_at',
    ];

    protected $casts = [
        'adjustment_date' => 'date',
    ];

    public function account(): BelongsTo
    {
        return $this->belongsTo(ChartOfAcc::class, 'inventory_adjustment_account_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(InventoryQuantityAdjustmentItem::class, 'inventory_quantity_adjustment_id');
    }
    public function journalEntry()
    {
        return $this->morphOne(JournalEntry::class, 'transactionable');
    }
}
