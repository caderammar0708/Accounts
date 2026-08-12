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
        'employee_id',
        'designation',
        'salary',
        'join_date',
        'location_id',
    ];


}
