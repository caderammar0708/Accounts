<?php

namespace App\Models\ServiceStation;

use Illuminate\Database\Eloquent\Model;
use App\Models\Item;

class WarrantyPolicy extends Model
{
    protected $fillable = [
        'name',
        'applies_to',
        'duration_days',
        'duration_km',
        'expiry_rule',
        'terms_text',
        'is_active',
    ];

    public function warranties()
    {
        return $this->hasMany(Warranty::class);
    }

    public function policyItems()
    {
        return $this->hasMany(WarrantyPolicyItem::class);
    }

    public function items()
    {
        return $this->belongsToMany(Item::class, 'warranty_policy_items', 'warranty_policy_id', 'item_id')
            ->withPivot('item_type')
            ->withTimestamps();
    }
}
