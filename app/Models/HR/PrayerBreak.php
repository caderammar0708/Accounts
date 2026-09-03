<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PrayerBreak extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'employee_id',
        'date',
        'start_time',
        'end_time',
        'status',
        'approved_by',
        'approved_at',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
