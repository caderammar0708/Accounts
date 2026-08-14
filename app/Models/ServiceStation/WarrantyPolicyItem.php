<?php

namespace App\Models\ServiceStation;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class WarrantyPolicyItem extends Model
{
    use HasUuids;

    protected $fillable = [
        'warranty_policy_id',
        'item_type',
        'item_id',
    ];

    public function warrantyPolicy()
    {
        return $this->belongsTo(WarrantyPolicy::class);
    }

    public function item()
    {
        return $this->belongsTo(Item::class, 'item_id');
    }
}
