<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;

use Illuminate\Http\Request;

use App\Models\FuelStation\Pump;
use App\Models\FuelStation\Tank;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class PumpController extends Controller
{
    public function index()
    {
        $pumps = Pump::with(['nozzles.tank.fuel_type'])->get();
        $tanks = Tank::with('fuel_type')->get();
        
        return Inertia::render('FuelStation/Pumps/Index', [
            'pumps' => $pumps,
            'tanks' => $tanks,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'nozzles' => 'required|array|min:1',
            'nozzles.*.name' => 'required|string|max:255',
            'nozzles.*.tank_id' => 'required|exists:tanks,id',
        ]);

        DB::transaction(function () use ($validated, $request) {
            $pump = Pump::create([
                'name' => $validated['name'],
            ]);

            foreach ($validated['nozzles'] as $nozzleData) {
                $pump->nozzles()->create([
                    'name' => $nozzleData['name'],
                    'tank_id' => $nozzleData['tank_id'],
                ]);
            }
        });

        return redirect()->back()->with('success', 'Pump created successfully.');
    }

    public function update(Request $request, Pump $pump)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'nozzles' => 'required|array|min:1',
            'nozzles.*.id' => 'nullable|exists:nozzles,id',
            'nozzles.*.name' => 'required|string|max:255',
            'nozzles.*.tank_id' => 'required|exists:tanks,id',
        ]);

        DB::transaction(function () use ($validated, $pump) {
            $pump->update([
                'name' => $validated['name'],
            ]);

            // Keep track of provided nozzle IDs to delete the removed ones
            $providedIds = collect($validated['nozzles'])->pluck('id')->filter()->toArray();
            $pump->nozzles()->whereNotIn('id', $providedIds)->delete();

            foreach ($validated['nozzles'] as $nozzleData) {
                if (!empty($nozzleData['id'])) {
                    $pump->nozzles()->where('id', $nozzleData['id'])->update([
                        'name' => $nozzleData['name'],
                        'tank_id' => $nozzleData['tank_id'],
                    ]);
                } else {
                    $pump->nozzles()->create([
                        'name' => $nozzleData['name'],
                        'tank_id' => $nozzleData['tank_id'],
                    ]);
                }
            }
        });

        return redirect()->back()->with('success', 'Pump updated successfully.');
    }

    public function destroy(Pump $pump)
    {
        $pump->delete();

        return redirect()->back()->with('success', 'Pump deleted successfully.');
    }
}
