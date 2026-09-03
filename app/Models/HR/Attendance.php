<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use OwenIt\Auditing\Contracts\Auditable;

class Attendance extends Model implements Auditable
{
    use SoftDeletes, \OwenIt\Auditing\Auditable;

    protected $fillable = [
        'employee_id', 'date', 'check_in', 'lunch_out', 'lunch_in', 'check_out', 
        'status', 'admin_note', 'latitude', 'longitude', 
        'checkout_latitude', 'checkout_longitude',
        'ip_address', 'device_id', 'is_remote', 'remote_status', 'remote_reason', 'is_qr'
    ];

    protected $appends = ['total_working_hours'];

    public function getTotalWorkingHoursAttribute()
    {
        if (!$this->check_in || !$this->check_out) {
            return 0;
        }

        $in = \Carbon\Carbon::parse($this->check_in);
        $out = \Carbon\Carbon::parse($this->check_out);

        if ($out->lessThan($in)) {
            $out->addDay();
        }

        $total_minutes = $in->diffInMinutes($out);

        if ($this->lunch_out && $this->lunch_in) {
            $l_out = \Carbon\Carbon::parse($this->lunch_out);
            $l_in = \Carbon\Carbon::parse($this->lunch_in);
            if ($l_in->lessThan($l_out)) {
                $l_in->addDay();
            }
            $total_minutes -= $l_out->diffInMinutes($l_in);
        }

        if ($this->relationLoaded('outsideLogs') && $this->outsideLogs) {
            foreach ($this->outsideLogs as $log) {
                if (strtolower($log->status) !== 'approved' && $log->in_time && $log->out_time) {
                    $o_out = \Carbon\Carbon::parse($log->out_time);
                    $o_in = \Carbon\Carbon::parse($log->in_time);
                    if ($o_in->lessThan($o_out)) {
                        $o_in->addDay();
                    }
                    $total_minutes -= $o_out->diffInMinutes($o_in);
                }
            }
        }

        return $total_minutes > 0 ? round($total_minutes / 60, 2) : 0;
    }

    protected $casts = [
        'date' => 'date',
        'check_in' => 'datetime:H:i',
        'lunch_out' => 'datetime:H:i',
        'lunch_in' => 'datetime:H:i',
        'check_out' => 'datetime:H:i',
        'outside_out' => 'datetime:H:i',
        'outside_in' => 'datetime:H:i',
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'checkout_latitude' => 'decimal:8',
        'checkout_longitude' => 'decimal:8',
        'is_remote' => 'boolean',
        'is_qr' => 'boolean',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function outsideLogs(): HasMany
    {
        return $this->hasMany(AttendanceOutsideLog::class);
    }

    public function timeAdjustmentRequests(): HasMany
    {
        return $this->hasMany(TimeAdjustmentRequest::class);
    }

    public function adjustments()
    {
        return $this->hasMany(AttendanceAdjustment::class)->orderBy('created_at', 'desc');
    }
}
