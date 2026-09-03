<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\HR\Shift;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ShiftController extends Controller
{
    public function index(Request $request)
    {
        $shifts = Shift::query();

        if ($request->filled('search')) {
            $shifts = $shifts->where('name', 'like', "%{$request->search}%");
        }

        $shifts = $shifts->latest()->paginate(10);

        return Inertia::render('Settings/HRSettings/Shift/Index', [
            'shifts' => $shifts,
            'filters'   => $request->only(['search']),
        ]);
    }

    public function create()
    {
        return Inertia::render('Settings/HRSettings/Shift/Form');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i',
            'half_day_start_time' => 'nullable|date_format:H:i',
            'half_day_end_time' => 'nullable|date_format:H:i',
            'working_days' => 'nullable|array',
        ]);

        Shift::create($validated);

        return redirect()->route('settings.hr.shifts.index')->with('success', 'Shift created.');
    }

    public function edit(Shift $shift)
    {
        return Inertia::render('Settings/HRSettings/Shift/Form', [
            'shift' => $shift,
        ]);
    }

    public function update(Request $request, Shift $shift)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i',
            'half_day_start_time' => 'nullable|date_format:H:i',
            'half_day_end_time' => 'nullable|date_format:H:i',
            'working_days' => 'nullable|array',
        ]);

        $shift->update($validated);

        return redirect()->route('settings.hr.shifts.index')->with('success', 'Shift updated.');
    }

    public function destroy(Shift $shift)
    {
        $shift->delete();
        return redirect()->route('settings.hr.shifts.index')->with('success', 'Shift deleted.');
    }
}
