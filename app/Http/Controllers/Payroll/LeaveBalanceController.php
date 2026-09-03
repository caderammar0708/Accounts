<?php

namespace App\Http\Controllers\Payroll;

use App\Http\Controllers\Controller;
use App\Models\HR\LeaveBalance;
use App\Models\HR\LeaveType;
use App\Models\HR\Employee;
use App\Traits\HandlesTransactions;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LeaveBalanceController extends Controller
{
    use HandlesTransactions;

    public function index(Request $request)
    {
        $balances = LeaveBalance::with(['employee', 'leaveType' => function($q) { $q->withTrashed(); }])->latest()->get();
        $leaveRuleService = app(\App\Services\LeaveRuleService::class);
        foreach ($balances as $balance) {
            if ($balance->employee && $balance->leaveType) {
                $entitlement = $leaveRuleService->calculateEntitlement($balance->employee, $balance->leaveType, $balance->year);
                $balance->entitlement = $entitlement;
                $balance->taken_days = max(0, $entitlement - $balance->remaining_days);
            } else {
                $balance->entitlement = 0;
                $balance->taken_days = 0;
            }
        }
        $employees = Employee::whereNull('left_date')->get(['id', 'name']);
        $leaveTypes = LeaveType::all(['id', 'name', 'days_per_year']);

        return Inertia::render('Payroll/Leave/Balances/IndexPage', [
            'balances' => $balances,
            'employees' => $employees,
            'leaveTypes' => $leaveTypes,
        ]);
    }

    public function assign(Request $request)
    {
        $data = $request->validate([
            'year' => 'required|integer|min:2020|max:2100',
            'auto_calculate' => 'nullable|boolean',
            'matrix' => 'required|array',
            'matrix.*.employee_id' => 'required|integer|exists:employees,id',
            'matrix.*.leave_type_id' => 'required|integer|exists:leave_types,id',
            'matrix.*.remaining_days' => 'required|numeric|min:0',
        ]);

        $this->withTransaction(function () use ($data) {
            $leaveRuleService = app(\App\Services\LeaveRuleService::class);

            foreach ($data['matrix'] as $row) {
                $days = floatval($row['remaining_days']);

                if (!empty($data['auto_calculate'])) {
                    $employee = \App\Models\HR\Employee::find($row['employee_id']);
                    $leaveType = \App\Models\HR\LeaveType::find($row['leave_type_id']);
                    if ($employee && $leaveType) {
                        $days = $leaveRuleService->calculateEntitlement($employee, $leaveType, intval($data['year']));
                    }
                }

                LeaveBalance::updateOrCreate(
                    [
                        'employee_id' => $row['employee_id'],
                        'leave_type_id' => $row['leave_type_id'],
                        'year' => $data['year']
                    ],
                    [
                        'remaining_days' => $days
                    ]
                );
            }
        });

        return redirect()->back()->with('success', 'Leave balances saved successfully.');
    }

    public function export()
    {
        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=leave_balances.csv",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $columns = ['Employee ID', 'Employee Name', 'Leave Type', 'Year', 'Remaining Days'];

        $callback = function() use ($columns) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);

            $balances = LeaveBalance::with(['employee', 'leaveType' => function($q) { $q->withTrashed(); }])->get();
            foreach ($balances as $balance) {
                fputcsv($file, [
                    $balance->employee_id,
                    $balance->employee?->name ?? 'N/A',
                    $balance->leaveType?->name ?? 'N/A',
                    $balance->year,
                    $balance->remaining_days
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
