<?php

namespace App\Http\Controllers\Payroll;

use App\Http\Controllers\Controller;
use App\Http\Requests\Payroll\PayrollRequest;
use App\Models\HR\Payroll;
use App\Models\HR\Payslip;
use App\Models\HR\Employee;
use App\Models\HR\SalaryStructure;
use App\Traits\HandlesTransactions;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PayrollController extends Controller
{
    use HandlesTransactions;

    const REDIRECTTO = 'payroll.index';

    public function index(Request $request)
    {
        $perPage = request('per_page', 10);
        $payrolls = Payroll::latest()->paginate($perPage);

        return Inertia::render('Payroll/Payroll/IndexPage', [
            'payrolls' => $payrolls,
            'perPage' => $perPage,
        ]);
    }

    public function create()
    {
        return Inertia::render('Payroll/Payroll/FormPage');
    }

    public function store(PayrollRequest $request)
    {
        $this->withTransaction(function () use ($request) {
            $data = $request->validated();
            $month = $data['month'];
            $year = $data['year'];

            $payroll = Payroll::create([
                'month' => $month,
                'year' => $year,
                'total_amount' => 0,
                'status' => 'Draft',
                'comment' => $data['comment'] ?? null,
            ]);

            $totalAmount = 0;
            $employees = Employee::whereNull('left_date')->with('salaryStructure')->get();

            foreach ($employees as $employee) {
                $structure = $employee->salaryStructure;
                if (!$structure) {
                    $structure = \App\Models\HR\SalaryStructure::firstOrCreate(
                        ['employee_id' => $employee->id],
                        [
                            'basic_salary' => 0.00,
                            'ot_rate_per_hour' => 0.00,
                            'allowances' => [],
                            'deductions' => [],
                            'bonus' => 0.00,
                            'loan_deduction' => 0.00,
                            'leave_deduction' => 0.00,
                        ]
                    );
                    $employee->load('salaryStructure');
                }

                $this->generatePayslip($payroll, $employee);
            }

            $totalAmount = Payslip::where('payroll_id', $payroll->id)->sum('net_salary');
            $payroll->update(['total_amount' => $totalAmount]);
        });

        return $this->redirectWithSuccess(SELF::REDIRECTTO, 'Payroll generated successfully.');
    }

    protected static function calculateTaxFromSlabs($grossSalary, $slabs)
    {
        if (!$slabs || !is_array($slabs)) {
            return 0.00;
        }

        $tax = 0.00;

        foreach ($slabs as $slab) {
            $min = (float)($slab['min'] ?? 0);
            $max = isset($slab['max']) && $slab['max'] !== null ? (float)$slab['max'] : null;
            $percent = (float)($slab['percent'] ?? 0);

            if ($grossSalary > $min) {
                $taxableAmountInSlab = $grossSalary - $min;
                
                if ($max !== null && $grossSalary > $max) {
                    $taxableAmountInSlab = $max - $min;
                }
                
                $tax += $taxableAmountInSlab * ($percent / 100.0);
            }
        }

        return $tax;
    }

    protected function generatePayslip(Payroll $payroll, Employee $employee)
    {
        $structure = $employee->salaryStructure;
        $basic = $structure->basic_salary;
        $bonus = $structure->bonus ?? 0;
        $loan_deduction = $structure->loan_deduction ?? 0;
        $leave_deduction = $structure->leave_deduction ?? 0;
        
        $setting = \App\Models\CompanyProfile::active();
        
        $epf_employee = 0.00;
        $epf_employer = 0.00;
        if (!isset($structure->deduct_epf) || $structure->deduct_epf) {
            $epf_employee = $basic * ($setting->epf_employee_percent / 100.0);
            $epf_employer = $basic * ($setting->epf_employer_percent / 100.0);
        }

        $etf = 0.00;
        if (!isset($structure->deduct_etf) || $structure->deduct_etf) {
            $etf = $basic * ($setting->etf_percent / 100.0);
        }

        $allowances = collect($structure->allowances)->sum('amount');
        
        $income_tax = 0.00;
        if (!isset($structure->deduct_tax) || $structure->deduct_tax) {
            if ($setting->deduct_income_tax) {
                if ($setting->manual_income_tax) {
                    $income_tax = $structure->income_tax ?? 0.00;
                } else {
                    $income_tax = self::calculateTaxFromSlabs($basic + $allowances, $setting->income_tax_slabs);
                }
            }
        }

        $ot_amount = 0.00;
        if ($setting->apply_ot) {
            $month = $payroll->month;
            $year = $payroll->year;
            
            $startDay = $setting->pay_cycle_start_day ?? 1;
            $endDay = $setting->pay_cycle_end_day ?? 31;
            
            if ($startDay > 1) {
                $startDate = \Carbon\Carbon::create($year, $month, 1)->subMonth()->day($startDay)->startOfDay();
            } else {
                $startDate = \Carbon\Carbon::create($year, $month, 1)->startOfDay();
            }
            
            $daysInMonth = \Carbon\Carbon::create($year, $month, 1)->daysInMonth;
            $actualEndDay = min($endDay, $daysInMonth);
            $endDate = \Carbon\Carbon::create($year, $month, $actualEndDay)->endOfDay();
            
            $attendances = \App\Models\HR\Attendance::with('outsideLogs')->where('employee_id', $employee->id)
                ->whereBetween('date', [$startDate->toDateString(), $endDate->toDateString()])
                ->whereNotNull('check_in')
                ->whereNotNull('check_out')
                ->get();
                
            $totalOtHours = 0.00;
            foreach ($attendances as $attendance) {
                try {
                    $checkIn = \Carbon\Carbon::parse($attendance->check_in);
                    $checkOut = \Carbon\Carbon::parse($attendance->check_out);
                    $hours = $checkOut->diffInMinutes($checkIn) / 60.0;
                    
                    if ($attendance->lunch_out && $attendance->lunch_in) {
                        $lunchOut = \Carbon\Carbon::parse($attendance->lunch_out);
                        $lunchIn = \Carbon\Carbon::parse($attendance->lunch_in);
                        $lunchHours = $lunchIn->diffInMinutes($lunchOut) / 60.0;
                        $hours -= $lunchHours;
                    } else {
                        if ($hours > 5.0) {
                            $hours -= 1.0;
                        }
                    }

                    if ($attendance->outsideLogs) {
                        foreach ($attendance->outsideLogs as $log) {
                            if ($log->status !== 'approved' && $log->in_time && $log->out_time) {
                                $o_out = \Carbon\Carbon::parse($log->out_time);
                                $o_in = \Carbon\Carbon::parse($log->in_time);
                                if ($o_in->lessThan($o_out)) {
                                    $o_in->addDay();
                                }
                                $outsideHours = $o_out->diffInMinutes($o_in) / 60.0;
                                $hours -= $outsideHours;
                            }
                        }
                    }
                    
                    $otHours = max(0.00, $hours - 8.0);
                    $totalOtHours += $otHours;
                } catch (\Exception $e) {
                    // skip malformed entries
                }
            }
            
            $ot_amount = $totalOtHours * ($structure->ot_rate_per_hour ?? 0.00);
        }

        // Query active advance salary recovery
        $advanceDeduction = 0.00;
        $activeAdvances = \App\Models\HR\AdvanceSalary::where('employee_id', $employee->id)
            ->whereRaw('recovered_amount < amount')
            ->where(function($query) use ($payroll) {
                $query->where('recover_from_year', '<', $payroll->year)
                    ->orWhere(function($q) use ($payroll) {
                        $q->where('recover_from_year', $payroll->year)
                          ->where('recover_from_month', '<=', $payroll->month);
                    });
            })
            ->get();

        foreach ($activeAdvances as $advance) {
            $outstanding = $advance->amount - $advance->recovered_amount;
            if ($advance->recovery_mode === 'Lumpsum') {
                $deduct = $outstanding;
            } else {
                $installmentAmount = $advance->amount / $advance->installments;
                $deduct = min($outstanding, $installmentAmount);
            }
            $advanceDeduction += $deduct;
        }

        $deductions = collect($structure->deductions)->sum('amount') + $epf_employee + $income_tax;

        $netSalary = $basic + $allowances - $deductions + $bonus - $loan_deduction - $leave_deduction + $ot_amount - $advanceDeduction;

        return Payslip::create([
            'payroll_id' => $payroll->id,
            'employee_id' => $employee->id,
            'basic_salary' => $basic,
            'allowances' => $structure->allowances,
            'deductions' => $structure->deductions,
            'ot_amount' => $ot_amount,
            'net_salary' => $netSalary,
            'epf_employee' => $epf_employee,
            'epf_employer' => $epf_employer,
            'etf' => $etf,
            'bonus' => $bonus,
            'loan_deduction' => $loan_deduction,
            'leave_deduction' => $leave_deduction,
            'income_tax' => $income_tax,
            'advance_deduction' => $advanceDeduction,
        ]);
    }

    public function show(Payroll $payroll)
    {
        return Inertia::render('Payroll/Payroll/PayslipsPage', [
            'payroll' => $payroll->load(),
        ]);
    }

    public function editSalaryStructure(Employee $employee)
    {
        $employee->load('salaryStructure');
        return Inertia::render('Payroll/Payroll/StaffSalaryPage', [
            'employee' => $employee,
        ]);
    }

    public function updateSalaryStructure(Request $request, Employee $employee)
    {
        $data = $request->validate([
            'basic_salary' => 'required|numeric',
            'allowances' => 'nullable|array',
            'deductions' => 'nullable|array',
            'ot_rate_per_hour' => 'nullable|numeric',
            'bonus' => 'nullable|numeric',
            'loan_deduction' => 'nullable|numeric',
            'leave_deduction' => 'nullable|numeric',
            'income_tax' => 'nullable|numeric',
            'deduct_epf' => 'nullable|boolean',
            'deduct_etf' => 'nullable|boolean',
            'deduct_tax' => 'nullable|boolean',
        ]);

        $oldStructure = SalaryStructure::where('employee_id', $employee->id)->first();

        if ($oldStructure) {
            $hasChanges = $oldStructure->basic_salary != $data['basic_salary'] ||
                          json_encode($oldStructure->allowances) != json_encode($data['allowances']) ||
                          json_encode($oldStructure->deductions) != json_encode($data['deductions']);

            if ($hasChanges) {
                \App\Models\HR\SalaryRevision::create([
                    'employee_id' => $employee->id,
                    'old_basic_salary' => $oldStructure->basic_salary,
                    'new_basic_salary' => $data['basic_salary'],
                    'old_allowances' => $oldStructure->allowances,
                    'new_allowances' => $data['allowances'] ?? [],
                    'old_deductions' => $oldStructure->deductions,
                    'new_deductions' => $data['deductions'] ?? [],
                    'changed_by' => auth()->user()?->name ?? 'Admin',
                ]);
            }
        } else {
            \App\Models\HR\SalaryRevision::create([
                'employee_id' => $employee->id,
                'old_basic_salary' => 0.00,
                'new_basic_salary' => $data['basic_salary'],
                'old_allowances' => [],
                'new_allowances' => $data['allowances'] ?? [],
                'old_deductions' => [],
                'new_deductions' => $data['deductions'] ?? [],
                'changed_by' => auth()->user()?->name ?? 'Admin',
            ]);
        }

        SalaryStructure::updateOrCreate(
            ['employee_id' => $employee->id],
            $data
        );

        return redirect()->back()->with('success', 'Salary structure updated.');
    }

    public function salaryRevisionIndex(Request $request)
    {
        $revisions = \App\Models\HR\SalaryRevision::with('employee')->latest()->get();
        $advances = \App\Models\HR\AdvanceSalary::with('employee')->latest()->get();
        $employees = \App\Models\HR\Employee::whereNull('left_date')->get(['id', 'name']);

        return Inertia::render('Payroll/Payroll/SalaryOperationPage', [
            'revisions' => $revisions,
            'advances' => $advances,
            'employees' => $employees,
        ]);
    }

    public function pay(Payroll $payroll)
    {
        $this->withTransaction(function () use ($payroll) {
            $payroll->update(['status' => 'Paid']);
            
            foreach ($payroll->payslips as $payslip) {
                if ($payslip->advance_deduction > 0) {
                    $remainingDeduct = $payslip->advance_deduction;
                    
                    $activeAdvances = \App\Models\HR\AdvanceSalary::where('employee_id', $payslip->employee_id)
                        ->whereRaw('recovered_amount < amount')
                        ->where(function($query) use ($payroll) {
                            $query->where('recover_from_year', '<', $payroll->year)
                                ->orWhere(function($q) use ($payroll) {
                                    $q->where('recover_from_year', $payroll->year)
                                      ->where('recover_from_month', '<=', $payroll->month);
                                });
                        })
                        ->get();
                        
                    foreach ($activeAdvances as $advance) {
                        if ($remainingDeduct <= 0) break;
                        
                        $outstanding = $advance->amount - $advance->recovered_amount;
                        $toDeduct = min($outstanding, $remainingDeduct);
                        
                        $advance->increment('recovered_amount', $toDeduct);
                        $remainingDeduct -= $toDeduct;
                        
                        if ($advance->recovered_amount >= $advance->amount) {
                            $advance->update(['status' => 'Fully Recovered']);
                        }
                    }
                }
            }
        });

        return redirect()->back()->with('success', 'Payroll marked as Paid and advance salary recoveries updated.');
    }

    public function updatePayslipAdjustments(Request $request, Payslip $payslip)
    {
        $data = $request->validate([
            'bonus' => 'required|numeric|min:0',
            'loan_deduction' => 'required|numeric|min:0',
            'leave_deduction' => 'required|numeric|min:0',
        ]);

        $setting = \App\Models\CompanyProfile::active();
        $basic = $payslip->basic_salary;
        
        $structure = \App\Models\HR\SalaryStructure::where('employee_id', $payslip->employee_id)->first();
        $epf_employee = 0.00;
        if (!$structure || !isset($structure->deduct_epf) || $structure->deduct_epf) {
            $epf_employee = $basic * ($setting->epf_employee_percent / 100.0);
        }
        
        $income_tax = 0.00;
        if (!$structure || !isset($structure->deduct_tax) || $structure->deduct_tax) {
            $income_tax = $payslip->income_tax ?? 0.00;
        }
        
        $allowances = collect($payslip->allowances)->sum('amount');
        $deductions = collect($payslip->deductions)->sum('amount') + $epf_employee + $income_tax;

        $netSalary = $basic + $allowances - $deductions + $data['bonus'] - $data['loan_deduction'] - $data['leave_deduction'] + ($payslip->ot_amount ?? 0.00) - ($payslip->advance_deduction ?? 0.00);

        $payslip->update([
            'bonus' => $data['bonus'],
            'loan_deduction' => $data['loan_deduction'],
            'leave_deduction' => $data['leave_deduction'],
            'net_salary' => $netSalary,
        ]);

        $payroll = $payslip->payroll;
        if ($payroll) {
            $totalAmount = Payslip::where('payroll_id', $payslip->payroll_id)->sum('net_salary');
            $payroll->update(['total_amount' => $totalAmount]);
        }

        return redirect()->back()->with('success', 'Monthly payslip adjustments updated.');
    }

    public function export(Payroll $payroll)
    {
        return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\PayrollExport($payroll->id), 'Payroll_Summary_' . $payroll->year . '_' . $payroll->month . '.xlsx');
    }

    public function exportEpf(Payroll $payroll)
    {
        return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\EpfExport($payroll->id), 'EPF_Summary_' . $payroll->year . '_' . $payroll->month . '.xlsx');
    }

    public function exportEtf(Payroll $payroll)
    {
        return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\EtfExport($payroll->id), 'ETF_Summary_' . $payroll->year . '_' . $payroll->month . '.xlsx');
    }

    public function exportTax(Payroll $payroll)
    {
        return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\TaxExport($payroll->id), 'Tax_Summary_' . $payroll->year . '_' . $payroll->month . '.xlsx');
    }

    public function downloadPdf(Payslip $payslip)
    {
        $payslip->load();
        $company = \App\Models\CompanyProfile::active();
        $payroll = $payslip->payroll;

        $allowancesTotal = collect($payslip->allowances)->sum('amount');
        $deductionsTotal = collect($payslip->deductions)->sum('amount') + ($payslip->epf_employee ?? 0) + ($payslip->income_tax ?? 0) + ($payslip->advance_deduction ?? 0);

        if ($company && $company->payslip_html_template) {
            $html = $company->payslip_html_template;
        } else {
            // Very basic fallback HTML if no template is set
            $html = "<h1>" . ($company->name ?? 'JobAlign') . "</h1><p>Payslip for " . ($payslip->employee->name ?? 'N/A') . "</p>
                     <p>Net Salary: {{net_salary}}</p>";
        }

        $monthYear = \Carbon\Carbon::createFromDate($payroll->year, $payroll->month, 1)->format('MMMM YYYY');
        $prefix = $company->currency_prefix ?? 'LKR';

        $format = function($amt) use ($prefix) {
            return $prefix . ' ' . number_format($amt, 2);
        };

        $replacements = [
            '{{company_name}}' => $company->name ?? 'JobAlign',
            '{{employee_name}}' => $payslip->employee->name ?? 'N/A',
            '{{employee_id}}' => $payslip->employee->employee_no ?? 'N/A',
            '{{department}}' => $payslip->employee->department ?? 'N/A',
            '{{designation}}' => $payslip->employee->designation ?? 'N/A',
            '{{month_year}}' => \Carbon\Carbon::createFromDate($payroll->year, $payroll->month, 1)->format('F Y'),
            '{{basic_salary}}' => $format($payslip->basic_salary),
            '{{ot_amount}}' => $format($payslip->ot_amount ?? 0),
            '{{epf_employee}}' => $format($payslip->epf_employee ?? 0),
            '{{epf_employer}}' => $format($payslip->epf_employer ?? 0),
            '{{etf}}' => $format($payslip->etf ?? 0),
            '{{income_tax}}' => $format($payslip->income_tax ?? 0),
            '{{bonus}}' => $format($payslip->bonus ?? 0),
            '{{loan_deduction}}' => $format($payslip->loan_deduction ?? 0),
            '{{leave_deduction}}' => $format($payslip->leave_deduction ?? 0),
            '{{advance_deduction}}' => $format($payslip->advance_deduction ?? 0),
            '{{net_salary}}' => $format($payslip->net_salary),
            '{{allowances}}' => $format($allowancesTotal),
            '{{deductions}}' => $format($deductionsTotal),
        ];

        foreach ($replacements as $key => $val) {
            $html = str_replace($key, $val, $html);
        }

        $fullHtml = '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Payslip</title>
    <style>
        body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 0; }
        * { box-sizing: border-box; }
    </style>
</head>
<body>
    ' . $html . '
</body>
</html>';

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadHTML($fullHtml);
        return $pdf->stream('Payslip_' . str_replace(' ', '_', $payslip->employee->name ?? 'Employee') . '_' . $payroll->year . '_' . $payroll->month . '.pdf');
    }
}
