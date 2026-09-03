<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\LeaveRequestMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use App\Models\HR\LeaveRequest;
use App\Models\HR\LeaveType;
use App\Models\HR\LeaveBalance;
use Carbon\Carbon;

class LeaveRequestController extends Controller
{
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'leave_type' => 'required|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'day_type' => 'nullable|string|in:Full Day,Half Day,Short Leave',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i',
            'reason' => 'required|string',
            'cc' => 'nullable|array',
            'cc.*' => 'email',
            'bcc' => 'nullable|array',
            'bcc.*' => 'email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();
        
        // Find matching LeaveType
        $leaveType = LeaveType::where('name', $request->leave_type)->first();
        if (!$leaveType) {
            $leaveType = LeaveType::first();
        }

        $dayType = $request->input('day_type', 'Full Day');
        if ($dayType === 'Short Leave') {
            $totalDays = 0; // Short leave doesn't deduct from full days

            // Validate maximum 90 minutes for short leave
            if ($request->start_time && $request->end_time) {
                $start = Carbon::createFromFormat('H:i', $request->start_time);
                $end = Carbon::createFromFormat('H:i', $request->end_time);
                
                // If end time is less than start time, assume it crosses midnight (though unlikely for short leave)
                if ($end->lt($start)) {
                    $end->addDay();
                }

                $diffInMinutes = $start->diffInMinutes($end);
                
                if ($diffInMinutes > 90) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Short leave duration cannot exceed 90 minutes.'
                    ], 422);
                }
            }
        } else {
            $totalDays = \App\Models\HR\LeaveRequest::calculateLeaveDays(
                $request->start_date, 
                $request->end_date, 
                $dayType, 
                $user->id
            );
        }

        // Validate Short Leave Limits
        if ($leaveType && $leaveType->is_short_leave) {
            $limitType = $leaveType->short_leave_limit_type; // 'month' or 'week'
            $limit = $leaveType->short_leave_limit;
            
            $query = LeaveRequest::where('employee_id', $user->id)
                ->where('leave_type_id', $leaveType->id)
                ->where('status', '!=', 'Rejected');

            if ($limitType === 'month') {
                $query->whereMonth('start_date', Carbon::parse($request->start_date)->month)
                      ->whereYear('start_date', Carbon::parse($request->start_date)->year);
            } elseif ($limitType === 'week') {
                $startOfWeek = Carbon::parse($request->start_date)->startOfWeek()->toDateString();
                $endOfWeek = Carbon::parse($request->start_date)->endOfWeek()->toDateString();
                $query->whereBetween('start_date', [$startOfWeek, $endOfWeek]);
            }
            
            $currentCount = $query->count();
            if ($limit && $currentCount >= $limit) {
                 return response()->json([
                    'success' => false,
                    'message' => 'Short leave limit exceeded for this ' . $limitType
                ], 422);
            }
        }

        // Save Leave Request in the DB
        LeaveRequest::create([
            'employee_id' => $user->id,
            'leave_type_id' => $leaveType ? $leaveType->id : 1,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
            'is_short_leave' => $leaveType ? $leaveType->is_short_leave : false,
            'total_days' => $totalDays,
            'day_type' => $dayType,
            'reason' => $request->reason,
            'status' => 'Pending'
        ]);

        foreach ($user->managers as $manager) {
            if (!empty($manager->fcm_token)) {
                $fcm = new \App\Services\FirebaseNotificationService();
                $fcm->sendToToken(
                    $manager->fcm_token,
                    'New Leave Request',
                    $user->name . ' has requested leave from ' . $request->start_date . ' to ' . $request->end_date,
                    ['type' => 'leave_request', 'id' => $leaveRequest->id ?? 0]
                );
            }
        }

        $data = $request->only(['leave_type', 'start_date', 'end_date', 'reason', 'cc', 'bcc']);
        $data['employee_name'] = $user->name;
        $data['employee_email'] = $user->email;

        try {
            $mailSetting = \App\Models\CompanyProfile::active();
            $receiver = $mailSetting->receiver_email ?: config('mail.from.address');
            
            $mail = Mail::to($receiver);
            
            if (!empty($mailSetting->cc_emails)) {
                $ccArray = array_map('trim', explode(',', $mailSetting->cc_emails));
                $ccArray = array_filter($ccArray, function($email) {
                    return filter_var($email, FILTER_VALIDATE_EMAIL);
                });
                if (!empty($ccArray)) {
                    $mail->cc($ccArray);
                }
            }
            
            if (!empty($mailSetting->bcc_emails)) {
                $bccArray = array_map('trim', explode(',', $mailSetting->bcc_emails));
                $bccArray = array_filter($bccArray, function($email) {
                    return filter_var($email, FILTER_VALIDATE_EMAIL);
                });
                if (!empty($bccArray)) {
                    $mail->bcc($bccArray);
                }
            }
            
            $mail->send(new LeaveRequestMail($data));
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Failed to send leave request email: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Leave request submitted successfully'
        ]);
    }

    public function history(Request $request)
    {
        $user = $request->user();
        if (!$user instanceof \App\Models\HR\Employee) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $leaves = LeaveRequest::with(['leaveType' => function($q) { $q->withTrashed(); }])
            ->where('employee_id', $user->id)
            ->orderBy('start_date', 'desc')
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'leave_type' => $item->leaveType ? $item->leaveType->name : 'Leave',
                    'start_date' => $item->start_date->toDateString(),
                    'end_date' => $item->end_date->toDateString(),
                    'start_time' => $item->start_time ? Carbon::parse($item->start_time)->format('H:i') : null,
                    'end_time' => $item->end_time ? Carbon::parse($item->end_time)->format('H:i') : null,
                    'is_short_leave' => $item->is_short_leave,
                    'total_days' => $item->total_days,
                    'day_type' => $item->day_type,
                    'reason' => $item->reason ?? '',
                    'status' => $item->status,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $leaves
        ]);
    }

    public function balance(Request $request)
    {
        $user = $request->user();
        if (!$user instanceof \App\Models\HR\Employee) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $currentYear = Carbon::now()->year;

        $balances = LeaveBalance::with(['leaveType'])
            ->where('employee_id', $user->id)
            ->where('year', $currentYear)
            ->whereHas('leaveType')
            ->get()
            ->map(function ($item) {
                return [
                    'leave_type' => $item->leaveType ? $item->leaveType->name : 'Leave',
                    'remaining_days' => $item->remaining_days,
                    'year' => $item->year,
                ];
            });

        if ($balances->isEmpty()) {
            $balances = collect(); // Return empty if not assigned
        }

        return response()->json([
            'success' => true,
            'data' => $balances
        ]);
    }

    public function types(Request $request)
    {
        $user = $request->user();
        if (!$user instanceof \App\Models\HR\Employee) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $currentYear = Carbon::now()->year;
        
        $assignedLeaveTypeIds = LeaveBalance::where('employee_id', $user->id)
            ->where('year', $currentYear)
            ->pluck('leave_type_id');

        $types = LeaveType::whereIn('id', $assignedLeaveTypeIds)->get()->map(function($type) {
            return [
                'id' => $type->id,
                'name' => $type->name,
                'is_short_leave' => $type->is_short_leave,
                'short_leave_limit_type' => $type->short_leave_limit_type,
                'short_leave_limit' => $type->short_leave_limit,
                'short_leave_time_minutes' => $type->short_leave_time_minutes,
            ];
        });
        
        return response()->json([
            'success' => true,
            'data' => $types
        ]);
    }
}

