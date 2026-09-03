<?php

namespace App\Http\Controllers\Payroll;

use App\Http\Controllers\Controller;
use App\Http\Requests\Payroll\AttendanceRequest;
use App\Models\HR\Attendance;
use App\Models\Department;
use App\Models\HR\Employee;
use App\Traits\HandlesTransactions;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class AttendanceController extends Controller
{
    use HandlesTransactions;

    const REDIRECTTO = 'attendance.index';

    public function index(Request $request)
    {
        $date = $request->input('date', Carbon::today()->toDateString());
        $perPage = request('per_page', 10);

        $query = Employee::with(['attendances' => function($q) use ($date) {
            $q->with(['outsideLogs', 'adjustments.adjuster'])->where('date', $date);
        }])->where(function($q) {
            $q->where('is_manager', false)->orWhereNull('is_manager');
        });

        if ($request->filled('department_id')) {
            $query->where('department_id', $request->department_id);
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        if ($request->boolean('adjusted_only')) {
            $query->whereHas('attendances', function($q) use ($date) {
                $q->where('date', $date)->has('adjustments');
            });
        }

        $employees = $perPage === 'All' ? $query->get() : $query->paginate($perPage);

        return Inertia::render('Payroll/Attendance/IndexPage', [
            'employees' => $employees,
            'departments' => Employee::whereNotNull('department')->distinct()->pluck('department')->map(function($d) { return ['id' => $d, 'name' => $d]; })->values(),
            'filters' => $request->only(['date', 'department_id', 'search', 'adjusted_only']),
            'perPage' => $perPage,
        ]);
    }

    public function store(AttendanceRequest $request)
    {
        $this->withTransaction(function () use ($request) {
            $data = $request->validated();
            
            $attendance = Attendance::where('employee_id', $data['employee_id'])
                ->where('date', $data['date'])
                ->first();

            if ($attendance) {
                $timeFields = ['check_in', 'check_out', 'lunch_in', 'lunch_out'];
                $hasChanges = false;
                $adjustmentData = [
                    'attendance_id' => $attendance->id,
                    'adjusted_by' => auth()->id(),
                    'reason' => $data['admin_note'] ?? null,
                ];
                
                $changes = [];
                foreach ($timeFields as $field) {
                    if (array_key_exists($field, $data)) {
                        $oldTime = $attendance->$field ? \Carbon\Carbon::parse($attendance->$field)->format('H:i') : null;
                        $newTime = !empty($data[$field]) ? \Carbon\Carbon::parse($data[$field])->format('H:i') : null;
                        
                        if ($oldTime !== $newTime) {
                            $adjustmentData['old_' . $field] = $oldTime;
                            $adjustmentData['new_' . $field] = $newTime;
                            $hasChanges = true;
                            $changes[] = ucfirst(str_replace('_', ' ', $field)) . " changed from " . ($oldTime ?: 'None') . " to " . ($newTime ?: 'None');
                        }
                    }
                }

                if (array_key_exists('status', $data) && $attendance->status !== $data['status']) {
                    $adjustmentData['old_status'] = $attendance->status;
                    $adjustmentData['new_status'] = $data['status'];
                    $hasChanges = true;
                    $changes[] = "Status changed from {$attendance->status} to {$data['status']}";
                }

                if ($hasChanges) {
                    $note = $data['admin_note'] ?? null;
                    $adjustmentData['reason'] = implode(', ', $changes) . ($note ? " | Note: $note" : "");
                    \App\Models\HR\AttendanceAdjustment::create($adjustmentData);
                }

                $attendance->update($data);
            } else {
                $attendance = Attendance::create($data);
                
                \App\Models\HR\AttendanceAdjustment::create([
                    'attendance_id' => $attendance->id,
                    'adjusted_by' => auth()->id(),
                    'reason' => 'Manually added by Admin. ' . ($data['admin_note'] ?? ''),
                    'new_check_in' => $data['check_in'] ?? null,
                    'new_check_out' => $data['check_out'] ?? null,
                    'new_lunch_in' => $data['lunch_in'] ?? null,
                    'new_lunch_out' => $data['lunch_out'] ?? null,
                    'new_status' => $data['status'] ?? null,
                ]);
            }
        });

        return redirect()->back()->with('success', 'Attendance updated.');
    }

    public function report(Request $request)
    {
        $from_date = $request->input('from_date', Carbon::now()->startOfMonth()->toDateString());
        $to_date = $request->input('to_date', Carbon::now()->endOfMonth()->toDateString());
        $employee_id = $request->input('employee_id');

        $query = Attendance::with(['employee', 'outsideLogs'])
            ->whereBetween('date', [$from_date, $to_date]);

        if ($employee_id) {
            $query->where('employee_id', $employee_id);
        }

        $attendances = $query->orderBy('date', 'desc')->get();

        $employees = Employee::orderBy('name')->get(['id', 'name', 'employee_id']);

        return Inertia::render('Payroll/Attendance/ReportPage', [
            'attendances' => $attendances,
            'employees' => $employees,
            'filters' => ['from_date' => $from_date, 'to_date' => $to_date, 'employee_id' => $employee_id]
        ]);
    }

    public function updateOutsideLogStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:pending,approved,rejected,cancelled',
        ]);

        $log = \App\Models\HR\AttendanceOutsideLog::findOrFail($id);
        $log->status = $request->status;
        $log->save();

        return redirect()->back()->with('success', 'Outside log status updated successfully.');
    }
}
