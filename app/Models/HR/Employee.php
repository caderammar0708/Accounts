<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

use App\Traits\BelongsToLocation;

class Employee extends Model
{
    use HasUuids, BelongsToLocation;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'mobile',
        'employee_id',
        'designation',
        'department',
        'address',
        'salary',
        'salary_type',
        'employment_type',
        'hours_per_day',
        'sales_commission_rate',
        'join_date',
        'location_id',
        'calling_name',
        'nic',
        'dob',
        'shift_id',
        'photo',
        'cv_path',
        'id_copy_path',
        'certificate_path',
        'left_date',
        'is_field_staff',
        'is_manager',
        'is_auto_attendance',
        'probation_duration_months',
        'probation_status',
        'probation_confirmed_date',
    ];

    protected $casts = [
        'is_field_staff' => 'boolean',
        'is_manager' => 'boolean',
        'is_auto_attendance' => 'boolean',
        'probation_confirmed_date' => 'date',
        'join_date' => 'date',
    ];

    protected $appends = ['manager_ids'];

    public function managers(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(Employee::class, 'employee_manager', 'employee_id', 'manager_id');
    }

    public function subordinates(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(Employee::class, 'employee_manager', 'manager_id', 'employee_id');
    }

    public function getManagerIdsAttribute()
    {
        return $this->managers->pluck('id')->toArray();
    }

    public function shift(): BelongsTo
    {
        return $this->belongsTo(Shift::class);
    }

    public function salaryStructure(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(SalaryStructure::class, 'employee_id', 'id');
    }

    public function attendances(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Attendance::class, 'employee_id', 'id');
    }

    public function leaveRequests(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(LeaveRequest::class, 'employee_id', 'id');
    }

    public function leaveBalances(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(LeaveBalance::class, 'employee_id', 'id');
    }

    public function payslips(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Payslip::class, 'employee_id', 'id');
    }

    public function advanceSalaries(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(AdvanceSalary::class, 'employee_id', 'id');
    }

    public function approvedLeaves(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(LeaveRequest::class, 'approved_by', 'id');
    }

    public function salaryRevisions(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(SalaryRevision::class, 'employee_id', 'id');
    }
}
