<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use OwenIt\Auditing\Contracts\Auditable;

class Payslip extends Model implements Auditable
{
    use \OwenIt\Auditing\Auditable;

    protected $fillable = [
        'payroll_id', 'employee_id', 'basic_salary', 
        'allowances', 'deductions', 'ot_amount', 'net_salary', 
        'epf_employee', 'epf_employer', 'etf',
        'bonus', 'loan_deduction', 'leave_deduction', 'income_tax', 'advance_deduction'
    ];

    protected $casts = [
        'allowances' => 'json',
        'deductions' => 'json',
        'basic_salary' => 'float',
        'ot_amount' => 'float',
        'net_salary' => 'float',
        'epf_employee' => 'float',
        'epf_employer' => 'float',
        'etf' => 'float',
        'bonus' => 'float',
        'loan_deduction' => 'float',
        'leave_deduction' => 'float',
        'income_tax' => 'float',
        'advance_deduction' => 'float',
    ];

    public function payroll(): BelongsTo
    {
        return $this->belongsTo(Payroll::class, 'payroll_id', 'id');
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }
}
