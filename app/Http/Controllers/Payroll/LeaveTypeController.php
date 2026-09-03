<?php

namespace App\Http\Controllers\Payroll;

use App\Http\Controllers\Controller;
use App\Http\Requests\Payroll\LeaveTypeRequest;
use App\Models\HR\LeaveType;
use App\Traits\HandlesTransactions;
use Inertia\Inertia;

class LeaveTypeController extends Controller
{
    use HandlesTransactions;

    const REDIRECTTO = 'leave-type.index';

    public function index()
    {
        return Inertia::render('Payroll/Leave/Types/IndexPage', [
            'leaveTypes' => LeaveType::get(),
            'employees' => \App\Models\HR\Employee::whereNull('left_date')->get(['id', 'name', 'employee_id'])
        ]);
    }

    public function store(LeaveTypeRequest $request)
    {
        $this->withTransaction(function () use ($request) {
            LeaveType::create($request->validated());
        });

        return $this->redirectWithSuccess(SELF::REDIRECTTO, 'Leave type created.');
    }

    public function update(LeaveTypeRequest $request, LeaveType $leaveType)
    {
        $this->withTransaction(function () use ($request, $leaveType) {
            $leaveType->update($request->validated());
        });

        return $this->redirectWithSuccess(SELF::REDIRECTTO, 'Leave type updated.');
    }

    public function destroy(LeaveType $leaveType)
    {
        $this->withTransaction(function () use ($leaveType) {
            $leaveType->delete();
        });

        return $this->redirectWithSuccess(SELF::REDIRECTTO, 'Leave type deleted.');
    }

    public function restore($id)
    {
        $this->withTransaction(function () use ($id) {
            $leaveType = LeaveType::withTrashed()->findOrFail($id);
            $leaveType->restore();
        });

        return $this->redirectWithSuccess(SELF::REDIRECTTO, 'Leave type restored successfully.');
    }
}
