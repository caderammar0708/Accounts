<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Model;

class AttendanceOutsideLog extends Model
{
    protected $fillable = [
        'attendance_id', 'out_time', 'in_time', 'reason',
        'latitude', 'longitude', 'in_latitude', 'in_longitude', 'status'
    ];

    public function attendance()
    {
        return $this->belongsTo(Attendance::class);
    }
}
