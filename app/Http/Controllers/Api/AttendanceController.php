<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HR\Attendance;
use App\Models\HR\Employee;
use App\Models\CompanyProfile;
use App\Models\HR\PrayerBreak;
use Illuminate\Http\Request;
use Carbon\Carbon;

class AttendanceController extends Controller
{
    public function todayStatus(Request $request)
    {
        $employee = $request->user()->employee;
        if (!$employee) {
            return response()->json(['message' => 'Unauthorized. Must be logged in as employee.'], 403);
        }

        $attendance = $this->getCurrentAttendance($employee->id);

        $openLog = $attendance ? $attendance->outsideLogs()->whereNull('in_time')->latest('out_time')->first() : null;
        $lastLog = $attendance ? $attendance->outsideLogs()->latest('out_time')->first() : null;

        return response()->json([
            'checked_in' => $attendance && $attendance->check_in ? true : false,
            'lunch_out' => $attendance && $attendance->lunch_out ? true : false,
            'lunch_in' => $attendance && $attendance->lunch_in ? true : false,
            'outside_out' => $openLog ? true : false,
            'outside_in' => $lastLog && $lastLog->in_time && !$openLog ? true : false,
            'checked_out' => $attendance && $attendance->check_out ? true : false,
            'check_in_time' => $attendance && $attendance->check_in ? Carbon::parse($attendance->check_in)->format('h:i A') : null,
            'lunch_out_time' => $attendance && $attendance->lunch_out ? Carbon::parse($attendance->lunch_out)->format('h:i A') : null,
            'lunch_in_time' => $attendance && $attendance->lunch_in ? Carbon::parse($attendance->lunch_in)->format('h:i A') : null,
            'outside_out_time' => $openLog ? Carbon::parse($openLog->out_time)->format('h:i A') : ($lastLog ? Carbon::parse($lastLog->out_time)->format('h:i A') : null),
            'outside_in_time' => $lastLog && $lastLog->in_time ? Carbon::parse($lastLog->in_time)->format('h:i A') : null,
            'outside_reason' => $openLog ? $openLog->reason : ($lastLog ? $lastLog->reason : null),
            'check_out_time' => $attendance && $attendance->check_out ? Carbon::parse($attendance->check_out)->format('h:i A') : null,
            'total_working_hours' => $attendance ? $attendance->total_working_hours : 0,
            'attendance' => $attendance ? $attendance->load('outsideLogs') : null
        ]);
    }

    public function checkIn(Request $request)
    {
        $request->validate([
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'device_id' => 'required|string',
            'is_remote' => 'boolean|nullable',
            'remote_reason' => 'required_if:is_remote,true|string|nullable',
        ]);

        $employee = $request->user()->employee; // Authenticated as Employee

        if (!$employee) {
            return response()->json(['message' => 'Unauthorized. Must be logged in as employee.'], 403);
        }

        $today = Carbon::today(config('app.timezone', 'Asia/Colombo'));
        
        $isQrCheckIn = $request->has('qr_token') && !empty($request->qr_token);
        if ($isQrCheckIn) {
            if (!\App\Http\Controllers\Admin\QrController::validateToken($request->qr_token)) {
                return response()->json(['message' => 'Invalid or expired QR code.'], 403);
            }
        }

        if (!$request->is_remote) {
            $todayName = strtolower($today->format('l'));
            $companyProfile = \App\Models\CompanyProfile::active();
            $workingDays = $companyProfile->working_days ?? \App\Models\CompanyProfile::getDefaultWorkingDays();

            if (isset($workingDays[$todayName]) && $workingDays[$todayName] === 'Non-Working Day') {
                return response()->json([
                    'message' => 'Attendance check-in is disabled on non-working days (' . ucfirst($todayName) . ').'
                ], 403);
            }

            $holiday = \App\Models\HR\Holiday::whereDate('date', $today)->first();
            if ($holiday && !$holiday->is_half_day) {
                return response()->json([
                    'message' => "Attendance check-in is disabled today due to holiday: {$holiday->name}."
                ], 403);
            }

            // Check Shift opening/closing time (Office Time)
            $employee->load('shift');
            if ($employee->shift) {
                $actualStartTime = $employee->shift->getStartTimeForDate($today);
                $actualEndTime = $employee->shift->getEndTimeForDate($today);
                if ($actualStartTime && $actualEndTime) {
                    $now = Carbon::now(config('app.timezone', 'Asia/Colombo'));
                    $currentTime = Carbon::parse($now->format('H:i:s'));
                    
                    $shiftStart = Carbon::parse($actualStartTime)->subHours(3); // Allow check-in 3 hours before
                    $shiftEnd = Carbon::parse($actualEndTime)->addHours(3); // Allow check-in 3 hours after
                
                if ($employee->shift->is_night_shift) {
                    $shiftEnd->addDay();
                    if ($currentTime->hour < 12) {
                        $currentTime->addDay();
                    }
                }

                if ($currentTime->lt($shiftStart) || $currentTime->gt($shiftEnd)) {
                    return response()->json([
                        'message' => 'Check-in is only allowed during office hours.'
                    ], 403);
                }
            }
        }
    }

        // 1. Validate Geofencing
        if (!$employee->is_field_staff && !$request->is_remote && !($request->has('qr_token') && !empty($request->qr_token))) {
            $minDistance = null;
            if (!$this->isValidLocation($employee, $request->latitude, $request->longitude, $minDistance)) {
                return response()->json([
                    'message' => 'You are outside the allowed office radius to mark attendance.',
                    'distance' => $minDistance !== null ? round($minDistance, 2) . 'm' : 'N/A'
                ], 403);
            }
        }



        $today = Carbon::today(config('app.timezone', 'Asia/Colombo'))->toDateString();

        // Check if already checked in
        $attendance = Attendance::where('employee_id', $employee->id)
            ->where('date', $today)
            ->first();

        if ($attendance && $attendance->check_in) {
            return response()->json(['message' => 'Already checked in for today.'], 400);
        }

        if (!$attendance) {
            $attendance = new Attendance();
            $attendance->employee_id = $employee->id;
            $attendance->date = $today;
        }

        $attendance->check_in = Carbon::now(config('app.timezone', 'Asia/Colombo'))->toTimeString();
        $attendance->status = 'Present';
        $attendance->latitude = $request->latitude;
        $attendance->longitude = $request->longitude;
        $attendance->ip_address = $request->ip();
        $attendance->device_id = $request->device_id;
        
        if ($request->is_remote) {
            $attendance->is_remote = true;
            $companyProfile = CompanyProfile::active();
            if ($companyProfile && $companyProfile->remote_checkin_auto_approve) {
                $attendance->remote_status = 'approved';
            } else {
                $attendance->remote_status = 'pending';
            }
            $attendance->remote_reason = $request->remote_reason;
        }

        if ($isQrCheckIn) {
            $attendance->is_qr = true;
        }
        
        $attendance->save();

        return response()->json([
            'message' => 'Check-in successful.',
            'data' => $attendance
        ]);
    }

    public function checkOut(Request $request)
    {
        $request->validate([
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'device_id' => 'required|string',
        ]);

        $employee = $request->user()->employee;

        if (!$employee) {
            return response()->json(['message' => 'Unauthorized. Must be logged in as employee.'], 403);
        }

        $attendance = $this->getCurrentAttendance($employee->id);

        $isQrCheckOut = $request->has('qr_token') && !empty($request->qr_token);
        if ($isQrCheckOut) {
            if (!\App\Http\Controllers\Admin\QrController::validateToken($request->qr_token)) {
                return response()->json(['message' => 'Invalid or expired QR code.'], 403);
            }
        }

        $attendance = $this->getCurrentAttendance($employee->id);

        // Validate Geofencing
        $isRemoteCheckout = $request->has('is_remote') && $request->is_remote;
        if (!$employee->is_field_staff && (! $attendance || !$attendance->is_remote) && !$isQrCheckOut && !$isRemoteCheckout) {
            $minDistance = null;
            if (!$this->isValidLocation($employee, $request->latitude, $request->longitude, $minDistance)) {
                return response()->json(['message' => 'You are outside the allowed office radius.'], 403);
            }
        }

        if (!$attendance || !$attendance->check_in) {
            return response()->json(['message' => 'No check-in record found for today.'], 400);
        }

        if ($attendance->check_out) {
            return response()->json(['message' => 'Already checked out for today.'], 400);
        }

        $attendance->check_out = Carbon::now(config('app.timezone', 'Asia/Colombo'))->toTimeString();
        $attendance->checkout_latitude = $request->latitude;
        $attendance->checkout_longitude = $request->longitude;

        if ($isRemoteCheckout && $request->has('remote_reason')) {
            $existingReason = $attendance->remote_reason ? $attendance->remote_reason . ' | ' : '';
            $attendance->remote_reason = $existingReason . 'Checkout: ' . $request->remote_reason;
        }

        $attendance->save();

        return response()->json([
            'message' => 'Check-out successful.',
            'data' => $attendance
        ]);
    }

    public function lunchOut(Request $request)
    {
        $request->validate([
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'device_id' => 'required|string',
        ]);

        $employee = $request->user()->employee;

        if (!$employee) {
            return response()->json(['message' => 'Unauthorized. Must be logged in as employee.'], 403);
        }

        $attendance = $this->getCurrentAttendance($employee->id);

        // Validate Geofencing
        if (!$employee->is_field_staff && (! $attendance || !$attendance->is_remote)) {
            $minDistance = null;
            if (!$this->isValidLocation($employee, $request->latitude, $request->longitude, $minDistance)) {
                return response()->json(['message' => 'You are outside the allowed office radius.'], 403);
            }
        }

        if (!$attendance || !$attendance->check_in) {
            return response()->json(['message' => 'No check-in record found for today.'], 400);
        }

        if ($attendance->lunch_out) {
            return response()->json(['message' => 'Already checked out for lunch today.'], 400);
        }

        $attendance->lunch_out = Carbon::now(config('app.timezone', 'Asia/Colombo'))->toTimeString();
        $attendance->save();

        return response()->json([
            'message' => 'Lunch break started.',
            'data' => $attendance
        ]);
    }

    public function lunchIn(Request $request)
    {
        $request->validate([
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'device_id' => 'required|string',
        ]);

        $employee = $request->user()->employee;

        if (!$employee) {
            return response()->json(['message' => 'Unauthorized. Must be logged in as employee.'], 403);
        }

        $attendance = $this->getCurrentAttendance($employee->id);

        // Validate Geofencing
        if (!$employee->is_field_staff && (! $attendance || !$attendance->is_remote)) {
            $minDistance = null;
            if (!$this->isValidLocation($employee, $request->latitude, $request->longitude, $minDistance)) {
                return response()->json(['message' => 'You are outside the allowed office radius.'], 403);
            }
        }

        if (!$attendance || !$attendance->lunch_out) {
            return response()->json(['message' => 'No lunch check-out record found today.'], 400);
        }

        if ($attendance->lunch_in) {
            return response()->json(['message' => 'Already returned from lunch break today.'], 400);
        }

        $attendance->lunch_in = Carbon::now(config('app.timezone', 'Asia/Colombo'))->toTimeString();
        $attendance->save();

        return response()->json([
            'message' => 'Returned from lunch break.',
            'data' => $attendance
        ]);
    }

    public function outsideOut(Request $request)
    {
        $request->validate([
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'device_id' => 'required|string',
            'outside_reason' => 'required|string',
        ]);

        $employee = $request->user()->employee;

        if (!$employee) {
            return response()->json(['message' => 'Unauthorized. Must be logged in as employee.'], 403);
        }



        $attendance = $this->getCurrentAttendance($employee->id);

        if (!$attendance || !$attendance->check_in) {
            return response()->json(['message' => 'No check-in record found for today.'], 400);
        }

        $openLog = $attendance->outsideLogs()->whereNull('in_time')->first();

        if ($openLog) {
            return response()->json(['message' => 'Already checked out for temporary outdoor duty today.'], 400);
        }

        $log = $attendance->outsideLogs()->create([
            'out_time' => Carbon::now(config('app.timezone', 'Asia/Colombo'))->toTimeString(),
            'reason' => $request->outside_reason,
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
        ]);

        return response()->json([
            'message' => 'Temporary outdoor duty started.',
            'data' => $log
        ]);
    }

    public function outsideIn(Request $request)
    {
        $request->validate([
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'device_id' => 'required|string',
        ]);

        $employee = $request->user()->employee;

        if (!$employee) {
            return response()->json(['message' => 'Unauthorized. Must be logged in as employee.'], 403);
        }



        $attendance = $this->getCurrentAttendance($employee->id);

        $openLog = $attendance->outsideLogs()->whereNull('in_time')->latest('out_time')->first();

        if (!$openLog) {
            return response()->json(['message' => 'No temporary outdoor duty check-out record found today, or already returned.'], 400);
        }

        $openLog->update([
            'in_time' => Carbon::now(config('app.timezone', 'Asia/Colombo'))->toTimeString(),
            'in_latitude' => $request->latitude,
            'in_longitude' => $request->longitude,
        ]);

        return response()->json([
            'message' => 'Returned from temporary outdoor duty.',
            'data' => $openLog
        ]);
    }

    public function history(Request $request)
    {
        $employee = $request->user()->employee;

        if (!$employee) {
            return response()->json(['message' => 'Unauthorized. Must be logged in as employee.'], 403);
        }

        $attendances = Attendance::with(['outsideLogs', 'timeAdjustmentRequests'])
            ->where('employee_id', $employee->id)
            ->orderBy('date', 'desc')
            ->limit(30)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'date' => $item->date ? $item->date->toDateString() : '',
                    'check_in' => $item->check_in ? Carbon::parse($item->check_in)->format('h:i A') : '-',
                    'lunch_out' => $item->lunch_out ? Carbon::parse($item->lunch_out)->format('h:i A') : '-',
                    'lunch_in' => $item->lunch_in ? Carbon::parse($item->lunch_in)->format('h:i A') : '-',
                    'check_out' => $item->check_out ? Carbon::parse($item->check_out)->format('h:i A') : '-',
                    'status' => $item->status ?? 'Present',
                    'admin_note' => $item->admin_note ?? '',
                    'outside_logs' => $item->outsideLogs,
                    'total_working_hours' => $item->total_working_hours,
                    'time_adjustment_requests' => $item->timeAdjustmentRequests,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $attendances
        ]);
    }

    public function requestTimeAdjustment(Request $request)
    {
        $request->validate([
            'attendance_id' => 'required|exists:attendances,id',
            'adjusted_type' => 'required|in:check_in,check_out,both',
            'requested_check_in_time' => 'nullable|date_format:H:i',
            'requested_check_out_time' => 'nullable|date_format:H:i',
            'reason' => 'required|string',
        ]);

        $employee = $request->user()->employee;
        if (!$employee) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $attendance = Attendance::where('id', $request->attendance_id)
            ->where('employee_id', $employee->id)
            ->first();

        if (!$attendance) {
            return response()->json(['message' => 'Attendance record not found.'], 404);
        }

        // Check if there's already a pending request
        $existing = \App\Models\HR\TimeAdjustmentRequest::where('attendance_id', $attendance->id)
            ->where('status', 'pending')
            ->first();

        if ($existing) {
            return response()->json(['message' => 'A pending time adjustment request already exists for this attendance record.'], 400);
        }

        $timeAdjustment = \App\Models\HR\TimeAdjustmentRequest::create([
            'attendance_id' => $attendance->id,
            'employee_id' => $employee->id,
            'adjusted_type' => $request->adjusted_type,
            'requested_check_in_time' => $request->requested_check_in_time,
            'requested_check_out_time' => $request->requested_check_out_time,
            'reason' => $request->reason,
            'status' => 'pending',
        ]);

        foreach ($employee->managers as $manager) {
            if (!empty($manager->fcm_token)) {
                $fcm = new \App\Services\FirebaseNotificationService();
                $fcm->sendToToken(
                    $manager->fcm_token,
                    'New Time Adjustment Request',
                    $employee->name . ' has requested a time adjustment.',
                    ['type' => 'time_adjustment', 'id' => $timeAdjustment->id ?? 0]
                );
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Time adjustment request submitted successfully.',
            'data' => $timeAdjustment
        ]);
    }

    public function applyPrayerBreak(Request $request)
    {
        $request->validate([
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
        ]);

        $employee = $request->user()->employee;
        if (!$employee) {
            return response()->json(['message' => 'Unauthorized. Must be logged in as employee.'], 403);
        }

        $companyProfile = CompanyProfile::active();
        $status = ($companyProfile && $companyProfile->prayer_break_auto_approve) ? 'Approved' : 'Pending';

        $prayerBreak = PrayerBreak::create([
            'employee_id' => $employee->id,
            'date' => Carbon::today(config('app.timezone', 'Asia/Colombo'))->toDateString(),
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
            'status' => $status,
            'approved_at' => $status === 'Approved' ? now() : null,
            'approved_by' => $status === 'Approved' ? 'System (Auto)' : null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Prayer break applied successfully.',
            'data' => $prayerBreak
        ]);
    }
    public function cancelOutsideLog(Request $request, $id)
    {
        $employee = $request->user()->employee;
        $log = \App\Models\HR\AttendanceOutsideLog::with('attendance')->findOrFail($id);
        
        if ($log->attendance->employee_id !== $employee->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($log->status !== 'rejected') {
            return response()->json(['message' => 'Only rejected logs can be cancelled.'], 400);
        }

        $log->status = 'cancelled';
        $log->save();

        return response()->json(['message' => 'Outside log cancelled successfully.']);
    }

    /**
     * Calculate distance between two points using Haversine formula
     */
    private function calculateDistance($lat1, $lon1, $lat2, $lon2)
    {
        $earthRadius = 6371000; // meters

        $latDelta = deg2rad($lat2 - $lat1);
        $lonDelta = deg2rad($lon2 - $lon1);

        $a = sin($latDelta / 2) * sin($latDelta / 2) +
            cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
            sin($lonDelta / 2) * sin($lonDelta / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }

    /**
     * Validate if the staff is within the allowed radius of any valid location.
     */
    private function isValidLocation($employee, $latitude, $longitude, &$minDistance = null)
    {
        // Get all global locations
        $globalLocations = \App\Models\Location::where('is_global', true)->get();
        
        // Get staff assigned locations
        $assignedLocations = $employee->locations()->get();
        
        // Merge collections
        $validLocations = $globalLocations->merge($assignedLocations);

        if ($validLocations->isEmpty()) {
            // Fallback to old behavior if no locations in DB
            $officeLat = config('settings.attendance.office_lat');
            $officeLng = config('settings.attendance.office_lng');
            $allowedRadius = config('settings.attendance.allowed_radius', 20);

            if ($officeLat && $officeLng) {
                $distance = $this->calculateDistance($latitude, $longitude, $officeLat, $officeLng);
                $minDistance = $distance;
                return $distance <= $allowedRadius;
            }
            return false; // No locations defined anywhere
        }

        $minDistance = PHP_FLOAT_MAX;
        $isValid = false;

        foreach ($validLocations as $location) {
            $distance = $this->calculateDistance(
                $latitude,
                $longitude,
                $location->latitude,
                $location->longitude
            );
            
            if ($distance < $minDistance) {
                $minDistance = $distance;
            }

            if ($distance <= $location->allowed_radius) {
                $isValid = true;
                // Don't break immediately, we might want the closest distance for logging in future,
                // but for now break is fine since we just need one valid location.
                break;
            }
        }

        return $isValid;
    }

    /**
     * Get the current active attendance record, accounting for night shifts.
     */
    private function getCurrentAttendance($employeeId)
    {
        $timezone = config('app.timezone', 'Asia/Colombo');
        $today = Carbon::today($timezone)->toDateString();
        $yesterday = Carbon::yesterday($timezone)->toDateString();

        // Fetch staff with shift info
        $employee = Employee::with('shift')->find($employeeId);
        $shift = $employee?->shift;

        $attendance = Attendance::where('employee_id', $employeeId)
            ->whereIn('date', [$today, $yesterday])
            ->orderBy('date', 'desc')
            ->get();



        $todayAtt = $attendance->first(function ($item) use ($today) {
            return $item->date->toDateString() === $today;
        });
        if ($todayAtt) return $todayAtt;

        $yesterdayAtt = $attendance->first(function ($item) use ($yesterday) {
            return $item->date->toDateString() === $yesterday;
        });

        if ($yesterdayAtt && !$yesterdayAtt->check_out) {
            if ($shift) {
                // If the employee is assigned to a night shift, carry it over (max 16 hours)
                if ($shift->is_night_shift) {
                    $checkInTime = $yesterdayAtt->check_in ? $yesterdayAtt->check_in->toTimeString() : '00:00:00';
                    $checkInDateTime = Carbon::parse($yesterdayAtt->date->toDateString() . ' ' . $checkInTime, $timezone);
                    if (Carbon::now($timezone)->diffInHours($checkInDateTime, true) < 16) {
                        return $yesterdayAtt;
                    }
                }
                // If they are on a day shift, do NOT carry over yesterday's shift to today
            } else {
                // Fallback to default 16-hour auto-expiration if no shift is assigned
                $checkInTime = $yesterdayAtt->check_in ? $yesterdayAtt->check_in->toTimeString() : '00:00:00';
                $checkInDateTime = Carbon::parse($yesterdayAtt->date->toDateString() . ' ' . $checkInTime, $timezone);
                if (Carbon::now($timezone)->diffInHours($checkInDateTime, true) < 16) {
                    return $yesterdayAtt;
                }
            }
        }

        return null;
    }
}

