<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\ItemCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ItemCategoryController extends Controller
{
    public function index()
    {
        $categories = ItemCategory::with('parent')
            ->orderBy('sort_order', 'asc')
            ->orderBy('name', 'asc')
            ->get();
        return Inertia::render('Inventory/CategoryList', [
            'categories' => $categories,
            'locations' => \App\Models\Location::all()
        ]);
    }

    public function create()
    {
        $parents = ItemCategory::all();
        return Inertia::render('Inventory/CategoryForm', [
            'parents' => $parents
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'parent_id' => 'nullable|exists:item_categories,id',
            'location_id' => 'nullable|exists:locations,id',
        ]);

        ItemCategory::create($validated);

        return redirect()->route('item-categories.index')->with('success', 'Category created successfully');
    }

    public function edit(ItemCategory $itemCategory)
    {
        $parents = ItemCategory::where('id', '!=', $itemCategory->id)->get();
        return Inertia::render('Inventory/CategoryForm', [
            'category' => $itemCategory,
            'parents' => $parents
        ]);
    }

    public function update(Request $request, ItemCategory $itemCategory)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'parent_id' => 'nullable|exists:item_categories,id',
            'location_id' => 'nullable|exists:locations,id',
        ]);

        $itemCategory->update($validated);

        return redirect()->route('item-categories.index')->with('success', 'Category updated successfully');
    }

    public function destroy(ItemCategory $itemCategory)
    {
        $itemCategory->delete();
        return redirect()->route('item-categories.index')->with('success', 'Category deleted successfully');
    }

    public function reorder(Request $request)
    {
        $request->validate([
            'categories' => 'required|array',
            'categories.*.id' => 'required|uuid',
            'categories.*.sort_order' => 'required|integer',
        ]);

        \Illuminate\Support\Facades\DB::transaction(function () use ($request) {
            foreach ($request->categories as $categoryData) {
                ItemCategory::where('id', $categoryData['id'])->update(['sort_order' => $categoryData['sort_order']]);
            }
        });

        return response()->json(['success' => true]);
    }
}
