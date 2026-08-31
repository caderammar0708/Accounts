<?php

namespace App\Http\Middleware;

use App\Models\Location;
use Closure;
use Illuminate\Http\Request;

class SetCurrentLocationMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if ($user) {
            $companySetting = \App\Models\CompanySetting::current();
            if ($companySetting && ($companySetting->branches_enabled || $companySetting->business_type === 'Dealership')) {
                if ($user->location_id) {
                    // Locked user: strictly set session location to assigned location
                    session(['current_location_id' => $user->location_id]);
                } else {
                    // Unrestricted user: verify current session location or default to first active branch
                    $currentId = session('current_location_id');

                    if ($currentId) {
                        $validLocation = Location::where('id', $currentId)->where('is_active', true)->exists();
                        if (!$validLocation) {
                            $currentId = null;
                        }
                    }

                    if (!$currentId) {
                        $defaultLocation = Location::where('is_active', true)->first();
                        if ($defaultLocation) {
                            session(['current_location_id' => $defaultLocation->id]);
                        }
                    }
                }
            } else {
                // Branches are disabled, clear location session
                session()->forget('current_location_id');
            }
        }

        return $next($request);
    }
}
