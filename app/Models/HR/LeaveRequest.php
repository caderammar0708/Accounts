<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use OwenIt\Auditing\Contracts\Auditable;

class LeaveRequest extends Model implements Auditable
{
    use SoftDeletes, \OwenIt\Auditing\Auditable;

    protected $fillable = [
        'employee_id', 'leave_type_id', 'start_date', 'end_date', 
        'total_days', 'day_type', 'reason', 'status', 'approved_by', 'approved_at'
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'total_days' => 'float',
        'approved_at' => 'datetime',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function leaveType(): BelongsTo
    {
        return $this->belongsTo(LeaveType::class, 'leave_type_id', 'id');
    }


    public static function calculateLeaveDays($startDate, $endDate, $dayType = 'Full Day', $staffId = null)
    {
        if ($dayType === 'Half Day') {
            return 0.5;
        }

        $start = \Carbon\Carbon::parse($startDate);
        $end = \Carbon\Carbon::parse($endDate);
        
        $totalDays = 0;
        
        $holidays = Holiday::whereBetween('date', [$start->toDateString(), $end->toDateString()])
            ->get()
            ->keyBy(function($h) {
                return $h->date->toDateString();
            });

        $profile = CompanyProfile::active();
        $workingDays = $profile->working_days ?? CompanyProfile::getDefaultWorkingDays();

        if ($staffId) {
            $staff = Employee::with('shift')->find($staffId);
            if ($staff && $staff->shift && $staff->shift->working_days) {
                // Override with shift-specific working days
                foreach ($staff->shift->working_days as $day => $config) {
                    if (isset($config['type'])) {
                        $workingDays[$day] = $config['type'];
                    }
                }
            }
        }

        for ($date = $start->copy(); $date->lte($end); $date->addDay()) {
            $dateStr = $date->toDateString();
            
            // 1. Holiday takes precedence
            if (isset($holidays[$dateStr])) {
                $holiday = $holidays[$dateStr];
                if ($holiday->is_half_day) {
                    $totalDays += 0.5;
                }
                continue;
            }
            
            // 2. Check Working Days config
            $dayOfWeek = strtolower($date->format('l'));
            $dayStatus = $workingDays[$dayOfWeek] ?? 'Full Day';
            
            if ($dayStatus === 'Non-Working Day') {
                continue;
            } elseif ($dayStatus === 'Half Day') {
                $totalDays += 0.5;
            } else {
                $totalDays += 1.0;
            }
        }
        
        return $totalDays;
    }
}
