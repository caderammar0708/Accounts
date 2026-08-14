<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;

use Illuminate\Http\Request;

use App\Models\FuelStation\Tank;
use App\Models\Item;
use Inertia\Inertia;

class TankController extends Controller
{
    public function index()
    {
        $tanks = Tank::with('fuel_type')->get();
        $fuelTypes = Item::get(['id', 'name']);
        
        return Inertia::render('FuelStation/Tanks/Index', [
            'tanks' => $tanks,
            'fuelTypes' => $fuelTypes,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'item_id' => 'required|exists:items,id',
            'capacity' => 'required|numeric|min:0',
            'min_level' => 'required|numeric|min:0',
        ]);

        Tank::create($validated);

        return redirect()->back()->with('success', 'Tank created successfully.');
    }

    public function update(Request $request, Tank $tank)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'item_id' => 'required|exists:items,id',
            'capacity' => 'required|numeric|min:0',
            'min_level' => 'required|numeric|min:0',
        ]);

        $tank->update($validated);

        return redirect()->back()->with('success', 'Tank updated successfully.');
    }

    public function destroy(Tank $tank)
    {
        $tank->delete();

        return redirect()->back()->with('success', 'Tank deleted successfully.');
    }
}
