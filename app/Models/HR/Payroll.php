<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use OwenIt\Auditing\Contracts\Auditable;

class Payroll extends Model implements Auditable
{
    use SoftDeletes, \OwenIt\Auditing\Auditable;

    protected $fillable = ['month', 'year', 'total_amount', 'status', 'comment'];

    public function payslips(): HasMany
    {
        return $this->hasMany(Payslip::class, 'payroll_id', 'id');
    }
}
