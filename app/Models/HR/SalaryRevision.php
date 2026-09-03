<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use OwenIt\Auditing\Contracts\Auditable;

class SalaryRevision extends Model implements Auditable
{
    use \OwenIt\Auditing\Auditable;

    protected $fillable = [
        'employee_id', 'old_basic_salary', 'new_basic_salary', 
        'old_allowances', 'new_allowances', 'old_deductions', 'new_deductions', 'changed_by'
    ];

    protected $casts = [
        'old_basic_salary' => 'float',
        'new_basic_salary' => 'float',
        'old_allowances' => 'json',
        'new_allowances' => 'json',
        'old_deductions' => 'json',
        'new_deductions' => 'json',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }
}
