<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use OwenIt\Auditing\Contracts\Auditable;

class AdvanceSalary extends Model implements Auditable
{
    use \OwenIt\Auditing\Auditable;

    protected $fillable = [
        'employee_id', 'amount', 'recovery_mode', 'installments', 
        'recovered_amount', 'recover_from_month', 'recover_from_year', 'status'
    ];

    protected $casts = [
        'amount' => 'float',
        'recovered_amount' => 'float',
        'installments' => 'integer',
        'recover_from_month' => 'integer',
        'recover_from_year' => 'integer',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }
}
