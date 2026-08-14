<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\WarrantyPolicyRequest;
use App\Models\Item;
use App\Models\ServiceStation\WarrantyPolicy;
use Inertia\Inertia;

class WarrantyPolicyController extends Controller
{
    public function index()
    {
        $policies = WarrantyPolicy::orderBy('name')->get();

        return Inertia::render('ServiceStation/WarrantyPolicies/Index', [
            'policies' => $policies,
        ]);
    }

    public function create()
    {
        $items = Item::select('id', 'name', 'type')->orderBy('name')->get();

        return Inertia::render('ServiceStation/WarrantyPolicies/Form', [
            'policy' => null,
            'items' => $items,
        ]);
    }

    public function store(WarrantyPolicyRequest $request)
    {
        $policy = WarrantyPolicy::create(array_merge($request->validated(), [
            'is_active' => $request->boolean('is_active', true),
        ]));

        $this->syncPolicyItems($policy, $request->input('applicable_item_ids', []));

        return redirect()->route('warranty-policies.index')->with('success', 'Warranty policy created successfully.');
    }

    public function edit(WarrantyPolicy $warrantyPolicy)
    {
        $items = Item::select('id', 'name', 'type')->orderBy('name')->get();

        return Inertia::render('ServiceStation/WarrantyPolicies/Form', [
            'policy' => $warrantyPolicy->load('items'),
            'items' => $items,
        ]);
    }

    public function update(WarrantyPolicyRequest $request, WarrantyPolicy $warrantyPolicy)
    {
        $warrantyPolicy->update(array_merge($request->validated(), [
            'is_active' => $request->boolean('is_active', true),
        ]));

        $this->syncPolicyItems($warrantyPolicy, $request->input('applicable_item_ids', []));

        return redirect()->route('warranty-policies.index')->with('success', 'Warranty policy updated successfully.');
    }

    public function destroy(WarrantyPolicy $warrantyPolicy)
    {
        $warrantyPolicy->delete();

        return redirect()->route('warranty-policies.index')->with('success', 'Warranty policy deleted successfully.');
    }

    private function syncPolicyItems(WarrantyPolicy $policy, array $itemIds): void
    {
        $validItemTypes = $policy->applies_to === 'service' ? ['service'] : ['inventory', 'bundle', 'non-inventory'];
        $items = Item::whereIn('id', $itemIds)
            ->whereIn('type', $validItemTypes)
            ->get();

        $syncData = $items->mapWithKeys(function ($item) {
            return [$item->id => ['item_type' => $item->type]];
        })->toArray();

        $policy->items()->sync($syncData);
    }
}
