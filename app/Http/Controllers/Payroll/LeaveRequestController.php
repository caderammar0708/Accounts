<?php

namespace App\Http\Controllers\Payroll;

use App\Http\Controllers\Controller;
use App\Http\Requests\Payroll\LeaveRequestRequest;
use App\Models\HR\LeaveRequest;
use App\Models\HR\LeaveType;
use App\Models\HR\Employee;
use App\Models\HR\LeaveBalance;
use App\Traits\HandlesTransactions;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

class LeaveRequestController extends Controller
{
    use HandlesTransactions;

    const REDIRECTTO = 'leave-request.index';

    public function index(Request $request)
    {
        $perPage = request('per_page', 10);
        $query = LeaveRequest::with(['employee', 'leaveType' => function($q) { $q->withTrashed(); }])
            ->whereDoesntHave('employee', function ($q) {
                $q->where('is_manager', true);
            });

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->whereHas('employee', function($sq) use ($search) {
                    $sq->where('name', 'like', "%{$search}%")
                       ->orWhere('employee_id', 'like', "%{$search}%");
                })->orWhereHas('leaveType', function($sq) use ($search) {
                    $sq->where('name', 'like', "%{$search}%");
                });
            });
        }

        $leaveRequests = $perPage === 'All' ? $query->get() : $query->latest()->paginate($perPage);

        $balances = LeaveBalance::with(['employee', 'leaveType'])->latest()->get();
        $employees = Employee::whereNull('left_date')->get(['id', 'name']);
        $leaveTypes = LeaveType::all(['id', 'name', 'days_per_year']);

        return Inertia::render('Payroll/Leave/LeavesPage', [
            'leaveRequests' => $leaveRequests,
            'filters' => $request->only(['status', 'search']),
            'perPage' => $perPage,
            'balances' => $balances,
            'employees' => $employees,
            'leaveTypes' => $leaveTypes,
        ]);
    }

    public function create()
    {
        return Inertia::render('Payroll/Leave/Requests/FormPage', [
            'employees' => Employee::all(['id', 'employee_id', 'name']),
            'leaveTypes' => LeaveType::all(['id', 'name'])
        ]);
    }

    public function store(LeaveRequestRequest $request)
    {
        $this->withTransaction(function () use ($request) {
            $data = $request->validated();
            
            $dayType = $data['day_type'] ?? 'Full Day';
            if ($dayType === 'Short Leave') {
                $data['total_days'] = 0;
                
                if (isset($data['start_time']) && isset($data['end_time'])) {
                    $start = Carbon::createFromFormat('H:i', $data['start_time']);
                    $end = Carbon::createFromFormat('H:i', $data['end_time']);
                    if ($end->lt($start)) {
                        $end->addDay();
                    }
                    $diffInMinutes = $start->diffInMinutes($end);
                    if ($diffInMinutes > 90) {
                        throw \Illuminate\Validation\ValidationException::withMessages([
                            'end_time' => 'Short leave duration cannot exceed 90 minutes.'
                        ]);
                    }
                }
            } else if ($dayType === 'Half Day') {
                $data['total_days'] = 0.5;
            } else {
                $start = Carbon::parse($data['start_date']);
                $end = Carbon::parse($data['end_date']);
                $data['total_days'] = $start->diffInDays($end) + 1;
            }
            
            // Filter out cc and bcc before database insertion since they are not DB columns
            $dbData = array_diff_key($data, array_flip(['cc', 'bcc']));
            LeaveRequest::create($dbData);

            // Send email notification
            $employee = Employee::find($data['employee_id']);
            $leaveType = LeaveType::where('id', $data['leave_type_id'])->first();

            $ccEmails = $request->filled('cc') ? array_map('trim', explode(',', $request->cc)) : [];
            $bccEmails = $request->filled('bcc') ? array_map('trim', explode(',', $request->bcc)) : [];

            $emailData = [
                'leave_type' => $leaveType ? $leaveType->name : 'Leave',
                'start_date' => $data['start_date'],
                'end_date' => $data['end_date'],
                'reason' => $data['reason'] ?? '',
                'employee_name' => $employee ? $employee->name : 'Employee',
                'employee_email' => $employee ? $employee->email : '',
                'cc' => $ccEmails,
                'bcc' => $bccEmails,
            ];

            try {
                $mailSetting = \App\Models\CompanyProfile::active();
                $receiver = $mailSetting->receiver_email ?: config('mail.from.address');
                
                $mail = \Illuminate\Support\Facades\Mail::to($receiver);
                
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
                
                $mail->send(new \App\Mail\LeaveRequestMail($emailData));
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Failed to send leave request email from web: ' . $e->getMessage());
            }
        });

        return $this->redirectWithSuccess(SELF::REDIRECTTO, 'Leave request submitted.');
    }

    public function updateStatus(Request $request, LeaveRequest $leaveRequest)
    {
        $request->validate([
            'status' => 'required|in:Approved,Rejected',
        ]);

        $this->withTransaction(function () use ($request, $leaveRequest) {
            $user = auth()->user();
            $leaveRequest->update([
                'status' => $request->status,
                'approved_by' => $user ? $user->name : 'Admin',
                'approved_at' => now(),
            ]);

            if ($request->status === 'Approved') {
                $this->updateLeaveBalance($leaveRequest);
            }
        });

        return redirect()->back()->with('success', 'Leave request ' . $request->status);
    }

    protected function updateLeaveBalance(LeaveRequest $request)
    {
        $balance = LeaveBalance::firstOrCreate(
            [
                'employee_id' => $request->employee_id,
                'leave_type_id' => $request->leave_type_id,
                'year' => Carbon::parse($request->start_date)->year
            ],
            ['remaining_days' => 0] 
        );

        $balance->decrement('remaining_days', $request->total_days);
    }
}
