<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalaryStructure extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'basic_salary',
        'ot_rate_per_hour',
        'bonus',
        'loan_deduction',
        'leave_deduction',
        'income_tax',
        'allowances',
        'deductions',
        'deduct_epf',
        'deduct_etf',
        'deduct_tax'
    ];

    protected $casts = [
        'allowances' => 'array',
        'deductions' => 'array',
        'deduct_epf' => 'boolean',
        'deduct_etf' => 'boolean',
        'deduct_tax' => 'boolean',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}
