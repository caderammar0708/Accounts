<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AttendanceLocation extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'latitude',
        'longitude',
        'allowed_radius',
        'is_global'
    ];

    public function employee()
    {
        return $this->belongsToMany(Employee::class, 'attendance_location_staff', 'attendance_location_id', 'employee_id');
    }
}
