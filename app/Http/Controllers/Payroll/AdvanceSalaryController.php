<?php

namespace App\Http\Controllers\Payroll;

use App\Http\Controllers\Controller;
use App\Models\HR\AdvanceSalary;
use App\Models\HR\Employee;
use App\Traits\HandlesTransactions;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdvanceSalaryController extends Controller
{
    use HandlesTransactions;

    public function index()
    {
        $advances = AdvanceSalary::with('employee')->latest()->get();
        $employees = Employee::whereNull('left_date')->get(['id', 'name']);

        return Inertia::render('Payroll/AdvanceSalary/IndexPage', [
            'advances' => $advances,
            'employees' => $employees,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'employee_id' => 'required|integer|exists:employees,id',
            'amount' => 'required|numeric|min:1',
            'recovery_mode' => 'required|in:Lumpsum,Installment',
            'installments' => 'required_if:recovery_mode,Installment|nullable|integer|min:1',
            'recover_from_month' => 'required|integer|min:1|max:12',
            'recover_from_year' => 'required|integer|min:2020|max:2100',
        ]);

        $this->withTransaction(function () use ($data) {
            $installments = $data['recovery_mode'] === 'Lumpsum' ? 1 : intval($data['installments']);
            
            AdvanceSalary::create([
                'employee_id' => $data['employee_id'],
                'amount' => $data['amount'],
                'recovery_mode' => $data['recovery_mode'],
                'installments' => $installments,
                'recovered_amount' => 0.00,
                'recover_from_month' => $data['recover_from_month'],
                'recover_from_year' => $data['recover_from_year'],
                'status' => 'Approved',
            ]);
        });

        return redirect()->back()->with('success', 'Advance salary payout recorded successfully.');
    }

    public function destroy(AdvanceSalary $advanceSalary)
    {
        $this->withTransaction(function () use ($advanceSalary) {
            $advanceSalary->delete();
        });

        return redirect()->back()->with('success', 'Advance salary plan cancelled successfully.');
    }
}
