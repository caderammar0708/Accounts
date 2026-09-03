<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AttendanceAdjustment extends Model
{
    protected $fillable = [
        'attendance_id',
        'adjusted_by',
        'old_check_in', 'new_check_in',
        'old_lunch_out', 'new_lunch_out',
        'old_lunch_in', 'new_lunch_in',
        'old_check_out', 'new_check_out',
        'old_status', 'new_status',
        'reason'
    ];

    public function attendance(): BelongsTo
    {
        return $this->belongsTo(Attendance::class);
    }

    public function adjuster(): BelongsTo
    {
        return $this->belongsTo(User::class, 'adjusted_by');
    }
}
