<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HR\Attendance;
use App\Models\HR\LeaveRequest;
use App\Models\HR\AttendanceOutsideLog;
use App\Models\HR\LeaveBalance;
use App\Models\HR\PrayerBreak;
use Carbon\Carbon;
use Illuminate\Http\Request;

class ManagerController extends Controller
{
    public function dashboard(Request $request)
    {
        $employee = $request->user()->employee;
        if (!$employee || !$employee->is_manager) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $subordinateIds = $employee->subordinates()->pluck('employees.id');
        $subordinateIds->push($employee->id);

        $pendingRemoteCount = Attendance::whereIn('employee_id', $subordinateIds)
            ->where('is_remote', true)
            ->whereIn('remote_status', ['pending', 'Pending'])
            ->count();

        $pendingLeavesCount = LeaveRequest::whereIn('employee_id', $subordinateIds)
            ->whereIn('status', ['pending', 'Pending'])
            ->where('day_type', '!=', 'Short Leave')
            ->count();
            
        $pendingShortLeavesCount = LeaveRequest::whereIn('employee_id', $subordinateIds)
            ->whereIn('status', ['pending', 'Pending'])
            ->where('day_type', 'Short Leave')
            ->count();

        $pendingOutsideCount = AttendanceOutsideLog::whereHas('attendance', function ($q) use ($subordinateIds) {
                $q->whereIn('employee_id', $subordinateIds);
            })
            ->whereIn('status', ['pending', 'Pending'])
            ->count();

        $pendingPrayerBreaksCount = PrayerBreak::whereIn('employee_id', $subordinateIds)
            ->whereIn('status', ['pending', 'Pending'])
            ->count();

        $requestedDate = $request->input('date');
        $dateStr = $requestedDate ? Carbon::parse($requestedDate)->toDateString() : Carbon::today(config('app.timezone', 'Asia/Colombo'))->toDateString();

        $todayAttendances = Attendance::with(['employee.shift'])
            ->whereIn('employee_id', $subordinateIds)
            ->where('date', $dateStr)
            ->get()
            ->map(function ($item) {
                $data = $item->toArray();
                $data['staff_name'] = $item->employee ? $item->employee->name : 'Unknown';
                $data['check_in_time'] = $item->check_in ? Carbon::parse($item->check_in)->format('h:i A') : 'Not Checked In';
                
                $late_minutes = 0;
                if ($item->check_in && $item->employee && $item->employee->shift) {
                    $actualStartTime = $item->employee->shift->getStartTimeForDate($item->date ?? now()->toDateString());
                    if ($actualStartTime) {
                        $shiftStart = Carbon::parse($actualStartTime);
                        $checkIn = Carbon::parse($item->check_in);
                        if ($checkIn->format('H:i:s') > $shiftStart->format('H:i:s')) {
                            $late_minutes = (int) Carbon::parse($shiftStart->format('H:i:s'))->diffInMinutes(Carbon::parse($checkIn->format('H:i:s')));
                        }
                    }
                }
                $data['late_minutes'] = $late_minutes;
                $data['late_text'] = $late_minutes > 0 
                    ? ($late_minutes >= 60 ? floor($late_minutes / 60) . 'h ' . ($late_minutes % 60) . 'm late' : $late_minutes . 'm late')
                    : 'On time';
                return $data;
            });

        $pendingTimeAdjustmentsCount = \App\Models\HR\TimeAdjustmentRequest::whereIn('employee_id', $subordinateIds)
            ->where('status', 'pending')
            ->count();

        return response()->json([
            'counts' => [
                'remote_attendances' => $pendingRemoteCount,
                'leaves' => $pendingLeavesCount,
                'short_leaves' => $pendingShortLeavesCount,
                'outside_logs' => $pendingOutsideCount,
                'prayer_breaks' => $pendingPrayerBreaksCount,
                'time_adjustments' => $pendingTimeAdjustmentsCount,
            ],
            'today_attendances' => $todayAttendances,
        ]);
    }

    public function getPendingRemoteAttendances(Request $request)
    {
        $employee = $request->user()->employee;
        if (!$employee || !$employee->is_manager) return response()->json(['message' => 'Unauthorized.'], 403);
        $subordinateIds = $employee->subordinates()->pluck('employees.id');
        $subordinateIds->push($employee->id);

        $query = Attendance::with('employee')
            ->whereIn('employee_id', $subordinateIds)
            ->where('is_remote', true);
            
        if ($request->has('from_date') && $request->has('to_date')) {
            $query->whereBetween('date', [$request->from_date, $request->to_date]);
        }
            
        $data = $query->orderBy('created_at', 'desc')
            ->limit(100)
            ->get()
            ->map(function ($item) {
                $arr = $item->toArray();
                $arr['date'] = Carbon::parse($item->date)->format('Y-m-d');
                $arr['created_at'] = Carbon::parse($item->created_at)->format('Y-m-d h:i A');
                $arr['remote_status'] = ucfirst($item->remote_status);
                return $arr;
            });
        return response()->json(['data' => $data]);
    }

    public function getPendingLeaves(Request $request)
    {
        $employee = $request->user()->employee;
        if (!$employee || !$employee->is_manager) return response()->json(['message' => 'Unauthorized.'], 403);
        $subordinateIds = $employee->subordinates()->pluck('employees.id');
        $subordinateIds->push($employee->id);

        $query = LeaveRequest::with(['employee', 'leaveType'])
            ->whereIn('employee_id', $subordinateIds)
            ->where('day_type', '!=', 'Short Leave');
            
        if ($request->has('from_date') && $request->has('to_date')) {
            $query->whereBetween('start_date', [$request->from_date, $request->to_date]);
        }
            
        $data = $query->orderBy('created_at', 'desc')
            ->limit(100)
            ->get()
            ->map(function ($item) {
                $arr = $item->toArray();
                $arr['start_date'] = Carbon::parse($item->start_date)->format('Y-m-d');
                $arr['end_date'] = Carbon::parse($item->end_date)->format('Y-m-d');
                $arr['created_at'] = Carbon::parse($item->created_at)->format('Y-m-d h:i A');
                $arr['status'] = ucfirst($item->status);
                return $arr;
            });
        return response()->json(['data' => $data]);
    }
    
    public function getPendingShortLeaves(Request $request)
    {
        $employee = $request->user()->employee;
        if (!$employee || !$employee->is_manager) return response()->json(['message' => 'Unauthorized.'], 403);
        $subordinateIds = $employee->subordinates()->pluck('employees.id');
        $subordinateIds->push($employee->id);

        $query = LeaveRequest::with(['employee', 'leaveType'])
            ->whereIn('employee_id', $subordinateIds)
            ->where('day_type', 'Short Leave');
            
        if ($request->has('from_date') && $request->has('to_date')) {
            $query->whereBetween('start_date', [$request->from_date, $request->to_date]);
        }
            
        $data = $query->orderBy('created_at', 'desc')
            ->limit(100)
            ->get()
            ->map(function ($item) {
                $arr = $item->toArray();
                $arr['start_date'] = Carbon::parse($item->start_date)->format('Y-m-d');
                $arr['end_date'] = Carbon::parse($item->end_date)->format('Y-m-d');
                $arr['start_time'] = $item->start_time ? Carbon::parse($item->start_time)->format('h:i A') : '';
                $arr['end_time'] = $item->end_time ? Carbon::parse($item->end_time)->format('h:i A') : '';
                $arr['created_at'] = Carbon::parse($item->created_at)->format('Y-m-d h:i A');
                $arr['status'] = ucfirst($item->status);
                return $arr;
            });
        return response()->json(['data' => $data]);
    }

    public function getPendingOutsideLogs(Request $request)
    {
        $employee = $request->user()->employee;
        if (!$employee || !$employee->is_manager) return response()->json(['message' => 'Unauthorized.'], 403);
        $subordinateIds = $employee->subordinates()->pluck('employees.id');
        $subordinateIds->push($employee->id);

        $query = AttendanceOutsideLog::with(['attendance.employee'])
            ->whereHas('attendance', function ($q) use ($subordinateIds, $request) {
                $q->whereIn('employee_id', $subordinateIds);
                if ($request->has('from_date') && $request->has('to_date')) {
                    $q->whereBetween('date', [$request->from_date, $request->to_date]);
                }
            });
            
        $data = $query->orderBy('created_at', 'desc')
            ->limit(100)
            ->get()
            ->map(function ($item) {
                $arr = $item->toArray();
                if (isset($arr['attendance']['date'])) {
                    $arr['attendance']['date'] = Carbon::parse($arr['attendance']['date'])->format('Y-m-d');
                }
                $arr['out_time'] = $item->out_time ? Carbon::parse($item->out_time)->format('h:i A') : '';
                $arr['in_time'] = $item->in_time ? Carbon::parse($item->in_time)->format('h:i A') : '';
                $arr['created_at'] = Carbon::parse($item->created_at)->format('Y-m-d h:i A');
                $arr['status'] = ucfirst($item->status);
                return $arr;
            });
        return response()->json(['data' => $data]);
    }

    public function approveRemoteAttendance(Request $request, $id)
    {
        $request->validate(['status' => 'required|in:approved,rejected']);
        $employee = $request->user()->employee;

        $attendance = Attendance::findOrFail($id);
        if (!$attendance->employee->managers->contains($employee->id) && $attendance->employee_id !== $employee->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $attendance->remote_status = $request->status;
        $attendance->save();

        return response()->json(['message' => 'Attendance remote status updated.']);
    }

    public function approveLeaveRequest(Request $request, $id)
    {
        $request->validate(['status' => 'required|in:Approved,Rejected']);
        $employee = $request->user()->employee;

        $leave = LeaveRequest::findOrFail($id);
        if (!$leave->employee->managers->contains($employee->id) && $leave->employee_id !== $employee->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $leave->status = $request->status;
        $leave->approved_by = $employee->name;
        $leave->approved_at = now();
        $leave->save();

        if ($request->status === 'Approved') {
            $this->updateLeaveBalance($leave);
        }

        return response()->json(['message' => 'Leave request status updated.']);
    }

    protected function updateLeaveBalance(LeaveRequest $leaveRequest)
    {
        $balance = LeaveBalance::firstOrCreate(
            [
                'employee_id' => $leaveRequest->employee_id,
                'leave_type_id' => $leaveRequest->leave_type_id,
                'year' => Carbon::parse($leaveRequest->start_date)->year
            ],
            ['remaining_days' => 0] 
        );

        $balance->decrement('remaining_days', $leaveRequest->total_days);
    }

    public function approveOutsideLog(Request $request, $id)
    {
        $request->validate(['status' => 'required|in:approved,rejected']);
        $employee = $request->user()->employee;

        $log = AttendanceOutsideLog::with('attendance.employee')->findOrFail($id);
        if (!$log->attendance->employee->managers->contains($employee->id) && $log->attendance->employee_id !== $employee->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $log->status = $request->status;
        $log->save();

        return response()->json(['message' => 'Outside log status updated.']);
    }

    public function getPendingPrayerBreaks(Request $request)
    {
        $employee = $request->user()->employee;
        if (!$employee || !$employee->is_manager) return response()->json(['message' => 'Unauthorized.'], 403);
        $subordinateIds = $employee->subordinates()->pluck('employees.id');
        $subordinateIds->push($employee->id);

        $query = PrayerBreak::with('employee')
            ->whereIn('employee_id', $subordinateIds);
            
        if ($request->has('from_date') && $request->has('to_date')) {
            $query->whereBetween('date', [$request->from_date, $request->to_date]);
        }
            
        $data = $query->orderBy('created_at', 'desc')
            ->limit(100)
            ->get()
            ->map(function ($item) {
                $arr = $item->toArray();
                $arr['date'] = Carbon::parse($item->date)->format('Y-m-d');
                $arr['start_time'] = $item->start_time ? Carbon::parse($item->start_time)->format('h:i A') : '';
                $arr['end_time'] = $item->end_time ? Carbon::parse($item->end_time)->format('h:i A') : '';
                $arr['created_at'] = Carbon::parse($item->created_at)->format('Y-m-d h:i A');
                $arr['status'] = ucfirst($item->status);
                return $arr;
            });
        return response()->json(['data' => $data]);
    }

    public function approvePrayerBreak(Request $request, $id)
    {
        $request->validate(['status' => 'required|in:Approved,Rejected']);
        $employee = $request->user()->employee;

        $break = PrayerBreak::findOrFail($id);
        if (!$break->employee->managers->contains($employee->id) && $break->employee_id !== $employee->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $break->status = $request->status;
        $break->approved_by = $employee->name;
        $break->approved_at = now();
        $break->save();

        return response()->json(['message' => 'Prayer break status updated.']);
    }
    public function getPendingTimeAdjustments(Request $request)
    {
        $employee = $request->user()->employee;
        if (!$employee || !$employee->is_manager) return response()->json(['message' => 'Unauthorized.'], 403);
        $subordinateIds = $employee->subordinates()->pluck('employees.id');
        $subordinateIds->push($employee->id);

        $query = \App\Models\HR\TimeAdjustmentRequest::with(['employee', 'attendance'])
            ->whereIn('employee_id', $subordinateIds);
            
        if ($request->has('from_date') && $request->has('to_date')) {
            $query->whereHas('attendance', function($q) use ($request) {
                $q->whereBetween('date', [$request->from_date, $request->to_date]);
            });
        }
            
        $data = $query->orderBy('created_at', 'desc')
            ->limit(100)
            ->get()
            ->map(function ($item) {
                $arr = $item->toArray();
                $arr['date'] = $item->attendance ? Carbon::parse($item->attendance->date)->format('Y-m-d') : '';
                $arr['created_at'] = Carbon::parse($item->created_at)->format('Y-m-d h:i A');
                $arr['status'] = ucfirst($item->status);
                return $arr;
            });
        return response()->json(['data' => $data]);
    }

    public function approveTimeAdjustment(Request $request, $id)
    {
        $request->validate(['status' => 'required|in:approved,rejected']);
        $employee = $request->user()->employee;

        $adjustment = \App\Models\HR\TimeAdjustmentRequest::with('attendance')->findOrFail($id);
        if (!$adjustment->employee->managers->contains($employee->id) && $adjustment->employee_id !== $employee->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if ($adjustment->status !== 'pending') {
            return response()->json(['message' => 'This request is already processed.'], 400);
        }

        $adjustment->status = $request->status;
        $adjustment->approved_by = $employee->id; // it's employee_id but the field says approved_by user, wait, staff is user in this app. The user is a Staff.
        $adjustment->approved_at = now();
        $adjustment->save();

        if ($request->status === 'approved') {
            $attendance = $adjustment->attendance;
            
            $adminNote = "Adjusted by " . $employee->name . " (Reason: " . $adjustment->reason . ")";
            $attendance->admin_note = $attendance->admin_note ? $attendance->admin_note . " | " . $adminNote : $adminNote;

            if ($adjustment->adjusted_type === 'check_in' || $adjustment->adjusted_type === 'both') {
                if ($adjustment->requested_check_in_time) {
                    $attendance->check_in = $adjustment->requested_check_in_time;
                }
            }
            if ($adjustment->adjusted_type === 'check_out' || $adjustment->adjusted_type === 'both') {
                if ($adjustment->requested_check_out_time) {
                    $attendance->check_out = $adjustment->requested_check_out_time;
                }
            }
            $attendance->save();
        }

        return response()->json(['message' => 'Time adjustment request status updated.']);
    }
}
