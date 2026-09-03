<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HR\Payslip;
use Illuminate\Http\Request;
use Carbon\Carbon;

class PayrollController extends Controller
{
    public function index(Request $request)
    {
        $employee = $request->user()->employee; // Authenticated as Employee

        if (!$employee) {
            return response()->json(['message' => 'Unauthorized. Must be logged in as employee.'], 403);
        }

        $year = $request->input('year', Carbon::now()->year);

        $payslips = Payslip::with('payroll')
            ->where('employee_id', $employee->id)
            ->whereHas('payroll', function($q) use ($year) {
                $q->where('year', $year);
            })
            ->get()
            ->sortByDesc(function ($payslip) {
                return $payslip->payroll->month ?? 0;
            })
            ->values()
            ->map(function ($payslip) {
                $month = $payslip->payroll->month ?? 1;
                $pYear = $payslip->payroll->year ?? $year;
                return [
                    'id' => $payslip->id,
                    'month_name' => Carbon::create()->month($month)->format('F'),
                    'month' => $month,
                    'year' => $pYear,
                    'net_pay' => $payslip->net_salary,
                    'status' => $payslip->payroll->status ?? 'Draft',
                ];
            });

        return response()->json([
            'year' => $year,
            'payslips' => $payslips
        ]);
    }

    public function show(Request $request, $id)
    {
        $employee = $request->user()->employee;

        if (!$employee) {
            return response()->json(['message' => 'Unauthorized. Must be logged in as employee.'], 403);
        }

        $payslip = Payslip::with(['payroll'])
            ->where('id', $id)
            ->where('employee_id', $employee->id)
            ->first();

        if (!$payslip) {
            return response()->json(['message' => 'Payslip not found'], 404);
        }

        $month = $payslip->payroll->month ?? 1;
        $month_name = Carbon::create()->month($month)->format('F');
        
        $allowancesTotal = collect($payslip->allowances)->sum('amount') + $payslip->bonus + $payslip->ot_amount;
        $gross_salary = $payslip->basic_salary + $allowancesTotal;

        return response()->json([
            'payslip' => [
                'id' => $payslip->id,
                'month_name' => $month_name,
                'year' => $payslip->payroll->year ?? null,
                'basic_salary' => $payslip->basic_salary,
                'gross_salary' => $gross_salary,
                'net_pay' => $payslip->net_salary,
                'status' => $payslip->payroll->status ?? 'Draft',
                'allowances' => $payslip->allowances,
                'ot_amount' => $payslip->ot_amount,
                'bonus' => $payslip->bonus,
                'loan_deduction' => $payslip->loan_deduction,
                'leave_deduction' => $payslip->leave_deduction,
                'income_tax' => $payslip->income_tax,
                'advance_deduction' => $payslip->advance_deduction,
                'epf_employee' => $payslip->epf_employee,
                'epf_employer' => $payslip->epf_employer,
                'etf' => $payslip->etf,
            ]
        ]);
    }
}
