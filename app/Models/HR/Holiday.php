<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Holiday extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'date',
        'is_half_day',
    ];

    protected $casts = [
        'date' => 'date',
        'is_half_day' => 'boolean',
    ];
}
