<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\HR\Holiday;
use App\Models\HR\LeaveRequest;
use Carbon\Carbon;

class CalendarController extends Controller
{
    public function index(Request $request)
    {
        $month = $request->input('month', now()->format('Y-m'));
        $startOfMonth = Carbon::parse($month)->startOfMonth();
        $endOfMonth = Carbon::parse($month)->endOfMonth();

        $holidays = Holiday::whereBetween('date', [$startOfMonth, $endOfMonth])
            ->get(['id', 'name', 'date', 'is_half_day']);

        // Only approved or pending leaves
        $leaves = LeaveRequest::with(['employee:id,name', 'leaveType:id,name'])
            ->whereIn('status', ['Approved', 'Pending'])
            ->where(function ($query) use ($startOfMonth, $endOfMonth) {
                $query->whereBetween('start_date', [$startOfMonth, $endOfMonth])
                      ->orWhereBetween('end_date', [$startOfMonth, $endOfMonth])
                      ->orWhere(function($q) use ($startOfMonth, $endOfMonth) {
                          $q->where('start_date', '<', $startOfMonth)
                            ->where('end_date', '>', $endOfMonth);
                      });
            })
            ->get(['id', 'employee_id', 'leave_type_id', 'start_date', 'end_date', 'status', 'day_type']);

        return Inertia::render('HR/Calendar/IndexPage', [
            'currentMonth' => $month,
            'holidays' => $holidays,
            'leaves' => $leaves,
        ]);
    }
}
