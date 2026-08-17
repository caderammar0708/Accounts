<?php

namespace App\Models\Accounting;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Models\User;
use OwenIt\Auditing\Contracts\Auditable;

use App\Traits\BelongsToLocation;

class JournalEntry extends Model implements Auditable
{
    use HasUuids, \OwenIt\Auditing\Auditable, BelongsToLocation;

    protected $fillable = [
        'currency_id',
        'exchange_rate',
        'date',
        'reference',
        'description',
        'transaction_type',
        'transactionable_id',
        'transactionable_type',
        'payee_id',
        'payee_type',
        'payment_method_id',
        'total_amount',
        'status',
        'created_by',
        'location_id',
    ];

    public function transactionable()
    {
        return $this->morphTo();
    }

    public function payee()
    {
        return $this->morphTo();
    }

    public function lines()
    {
        return $this->hasMany(JournalEntryLine::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
