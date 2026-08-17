<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Models\Accounting\ChartOfAcc;
use App\Models\ServiceStation\WarrantyPolicy;
use App\Traits\BelongsToLocation;

class Item extends Model
{
    use HasUuids, BelongsToLocation;

    protected $fillable = [
        'type',
        'name',
        'sku',
        'image',
        'description',
        'sale_price',
        'item_category_id',
        'income_account_id',
        'purchase_price',
        'expense_account_id',
        'track_inventory',
        'quantity_on_hand',
        'inventory_account_id',
        'as_of_date',
        'reorder_point',
        'purchase_description',
        'preferred_supplier_id',
        'is_sold',
        'is_purchased',
        'location_id',
    ];

    public function category()
    {
        return $this->belongsTo(ItemCategory::class, 'item_category_id');
    }

    public function incomeAccount()
    {
        return $this->belongsTo(ChartOfAcc::class, 'income_account_id');
    }

    public function expenseAccount()
    {
        return $this->belongsTo(ChartOfAcc::class, 'expense_account_id');
    }

    public function inventoryAccount()
    {
        return $this->belongsTo(ChartOfAcc::class, 'inventory_account_id');
    }

    public function preferredSupplier()
    {
        return $this->belongsTo(Supplier::class, 'preferred_supplier_id');
    }

    public function bundleComponents()
    {
        return $this->hasMany(BundleItem::class, 'bundle_id');
    }

    public function warrantyPolicies()
    {
        return $this->belongsToMany(WarrantyPolicy::class, 'warranty_policy_items', 'item_id', 'warranty_policy_id')
            ->withPivot('item_type')
            ->withTimestamps();
    }
}
