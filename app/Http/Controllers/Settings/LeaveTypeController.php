<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\HR\LeaveType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LeaveTypeController extends Controller
{
    public function index(Request $request)
    {
        $leaveTypes = LeaveType::query();

        if ($request->filled('search')) {
            $leaveTypes = $leaveTypes->where('name', 'like', "%{$request->search}%");
        }

        $leaveTypes = $leaveTypes->latest()->paginate(10);

        return Inertia::render('Settings/HRSettings/LeaveType/Index', [
            'leaveTypes' => $leaveTypes,
            'filters'   => $request->only(['search']),
        ]);
    }

    public function create()
    {
        return Inertia::render('Settings/HRSettings/LeaveType/Form');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'days_per_year' => 'required|integer|min:0',
            'is_short_leave' => 'boolean',
            'short_leave_limit_type' => 'nullable|in:month,week',
            'short_leave_limit' => 'nullable|integer|min:1',
            'short_leave_time_minutes' => 'nullable|integer|min:1',
            'comment' => 'nullable|string'
        ]);

        LeaveType::create($validated);

        return redirect()->route('settings.hr.leave-types.index')->with('success', 'Leave Type created.');
    }

    public function edit(LeaveType $leaveType)
    {
        return Inertia::render('Settings/HRSettings/LeaveType/Form', [
            'leaveType' => $leaveType,
        ]);
    }

    public function update(Request $request, LeaveType $leaveType)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'days_per_year' => 'required|integer|min:0',
            'is_short_leave' => 'boolean',
            'short_leave_limit_type' => 'nullable|in:month,week',
            'short_leave_limit' => 'nullable|integer|min:1',
            'short_leave_time_minutes' => 'nullable|integer|min:1',
            'comment' => 'nullable|string'
        ]);

        $leaveType->update($validated);

        return redirect()->route('settings.hr.leave-types.index')->with('success', 'Leave Type updated.');
    }

    public function destroy(LeaveType $leaveType)
    {
        $leaveType->delete();
        return redirect()->route('settings.hr.leave-types.index')->with('success', 'Leave Type deleted.');
    }
}
