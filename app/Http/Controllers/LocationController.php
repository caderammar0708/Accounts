<?php

namespace App\Http\Controllers;

use App\Models\Location;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LocationController extends Controller
{
    /**
     * Switch active branch for unrestricted users.
     */
    public function switchLocation(Request $request)
    {
        $user = $request->user();

        if ($user->location_id) {
            return redirect()->back()->with('error', 'You are locked to a specific branch and cannot switch branches.');
        }

        if ($request->location_id === 'all') {
            session(['current_location_id' => 'all']);
            return redirect()->back()->with('success', 'Switched to All Branches.');
        }

        $request->validate([
            'location_id' => 'required|exists:locations,id',
        ]);

        $location = Location::where('id', $request->location_id)->where('is_active', true)->firstOrFail();

        session(['current_location_id' => $location->id]);

        return redirect()->back()->with('success', "Switched to branch {$location->name}.");
    }

    /**
     * Display a listing of branches for Admin management.
     */
    public function index(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            abort(403);
        }

        $locations = Location::with(['users' => function ($query) {
            $query->select('id', 'name', 'email', 'role', 'location_id');
        }])->get();

        $allUsers = User::select('id', 'name', 'email', 'role', 'location_id')
            ->orderBy('name')
            ->get();

        return Inertia::render('Settings/Locations/Index', [
            'locations' => $locations,
            'users' => $allUsers,
        ]);
    }

    /**
     * Store a newly created location.
     */
    public function store(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50',
            'is_active' => 'boolean',
        ]);

        $location = Location::create([
            'name' => $validated['name'],
            'code' => $validated['code'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        // If this is the first location and session has none, set it
        if (!session()->has('current_location_id')) {
            session(['current_location_id' => $location->id]);
        }

        return redirect()->back()->with('success', 'Branch created successfully.');
    }

    /**
     * Update the specified location.
     */
    public function update(Request $request, Location $location)
    {
        if ($request->user()->role !== 'admin') {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50',
            'is_active' => 'boolean',
        ]);

        $location->update($validated);

        return redirect()->back()->with('success', 'Branch updated successfully.');
    }

    /**
     * Deactivate / delete the specified location.
     */
    public function destroy(Request $request, Location $location)
    {
        if ($request->user()->role !== 'admin') {
            abort(403);
        }

        // Unassign any assigned users first
        User::where('location_id', $location->id)->update(['location_id' => null]);

        $location->delete();

        if (session('current_location_id') == $location->id) {
            session()->forget('current_location_id');
        }

        return redirect()->back()->with('success', 'Branch removed successfully.');
    }

    /**
     * Assign a user to a location (lock user to branch).
     */
    public function assignUser(Request $request, Location $location)
    {
        if ($request->user()->role !== 'admin') {
            abort(403);
        }

        $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $targetUser = User::findOrFail($request->user_id);
        $targetUser->update(['location_id' => $location->id]);

        return redirect()->back()->with('success', "Assigned {$targetUser->name} to branch {$location->name}.");
    }

    /**
     * Unassign a user from a location (make user unrestricted).
     */
    public function unassignUser(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            abort(403);
        }

        $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $targetUser = User::findOrFail($request->user_id);
        $targetUser->update(['location_id' => null]);

        return redirect()->back()->with('success', "Unassigned branch from {$targetUser->name}.");
    }
}
