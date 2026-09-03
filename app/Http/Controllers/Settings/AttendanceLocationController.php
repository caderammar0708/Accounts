<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\HR\AttendanceLocation;
use App\Models\HR\Employee;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class AttendanceLocationController extends Controller
{
    public function index(Request $request)
    {
        $locations = AttendanceLocation::with('staff');

        if ($request->filled('search')) {
            $locations = $locations->where('name', 'like', "%{$request->search}%");
        }

        $locations = $locations->latest()->paginate(10);

        return Inertia::render('Settings/HRSettings/AttendanceLocation/Index', [
            'locations' => $locations,
            'filters'   => $request->only(['search']),
        ]);
    }

    public function create()
    {
        $staffMembers = Employee::all(['id', 'name']);
        return Inertia::render('Settings/HRSettings/AttendanceLocation/Form', [
            'staffMembers' => $staffMembers
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'allowed_radius' => 'required|integer|min:1',
            'is_global' => 'boolean',
            'staff_ids' => 'nullable|array'
        ]);

        DB::transaction(function () use ($validated, $request) {
            $location = AttendanceLocation::create($validated);
            if ($request->has('staff_ids') && !$request->is_global) {
                $location->staff()->sync($request->staff_ids);
            }
        });

        return redirect()->route('settings.hr.attendance-locations.index')->with('success', 'Location created.');
    }

    public function edit(AttendanceLocation $attendanceLocation)
    {
        $attendanceLocation->load('employee');
        $staffMembers = Employee::all(['id', 'name']);
        return Inertia::render('Settings/HRSettings/AttendanceLocation/Form', [
            'location' => $attendanceLocation,
            'staffMembers' => $staffMembers
        ]);
    }

    public function update(Request $request, AttendanceLocation $attendanceLocation)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'allowed_radius' => 'required|integer|min:1',
            'is_global' => 'boolean',
            'staff_ids' => 'nullable|array'
        ]);

        DB::transaction(function () use ($validated, $request, $attendanceLocation) {
            $attendanceLocation->update($validated);
            if ($request->is_global) {
                $attendanceLocation->staff()->detach();
            } else if ($request->has('staff_ids')) {
                $attendanceLocation->staff()->sync($request->staff_ids);
            }
        });

        return redirect()->route('settings.hr.attendance-locations.index')->with('success', 'Location updated.');
    }

    public function destroy(AttendanceLocation $attendanceLocation)
    {
        $attendanceLocation->delete();
        
        return redirect()->route('settings.hr.attendance-locations.index')->with('success', 'Location deleted.');
    }
}
