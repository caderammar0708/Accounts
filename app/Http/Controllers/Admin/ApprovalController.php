<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\HR\LeaveRequest;
use Inertia\Inertia;

class ApprovalController extends Controller
{
    public function index()
    {
        $shortLeaves = LeaveRequest::with(['employee:id,name,employee_id'])
            ->where('day_type', 'Short Leave')
            ->where('status', 'Pending')
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Admin/Approvals/IndexPage', [
            'shortLeaves' => $shortLeaves,
            'prayerBreaks' => [],
        ]);
    }

    public function updateShortLeaveStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|string|in:Approved,Rejected',
        ]);

        $leave = LeaveRequest::findOrFail($id);
        $leave->status = $request->status;
        $leave->approved_by = $request->user()->id;
        $leave->approved_at = now();
        $leave->save();

        return redirect()->back()->with('success', 'Short leave status updated successfully.');
    }
}
