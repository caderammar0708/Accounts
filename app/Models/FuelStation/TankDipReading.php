<?php

namespace App\Models\FuelStation;

use Illuminate\Database\Eloquent\Model;

use App\Models\User;
use App\Models\Company;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class TankDipReading extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'company_id',
        'tank_id',
        'date',
        'book_stock',
        'physical_dip',
        'variance',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'date' => 'date',
        'book_stock' => 'decimal:4',
        'physical_dip' => 'decimal:4',
        'variance' => 'decimal:4',
    ];

    public function tank()
    {
        return $this->belongsTo(Tank::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }
}
