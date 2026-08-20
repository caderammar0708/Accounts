<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

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
    ];


}
