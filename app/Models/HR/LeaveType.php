<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use OwenIt\Auditing\Contracts\Auditable;

class LeaveType extends Model implements Auditable
{
    use SoftDeletes, \OwenIt\Auditing\Auditable;
  
    protected $fillable = [
        'name', 
        'days_per_year', 
        'code', 
        'applies_sl_joining_rules', 
        'applies_probation_half_rate', 
        'comment',
        'is_short_leave',
        'short_leave_limit_type',
        'short_leave_limit',
        'short_leave_time_minutes'
    ];

    protected function casts(): array
    {
        return [
            'applies_sl_joining_rules' => 'boolean',
            'applies_probation_half_rate' => 'boolean',
            'is_short_leave' => 'boolean',
        ];
    }

    public function leaveRequests(): HasMany
    {
        return $this->hasMany(LeaveRequest::class, 'leave_type_id', 'id');
    }
}
