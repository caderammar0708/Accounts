<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

use App\Traits\BelongsToLocation;

class Supplier extends Model
{
    use HasUuids, BelongsToLocation;

    protected $fillable = [
        'display_name',
        'first_name',
        'last_name',
        'company_name',
        'email',
        'phone_number',
        'tax_id',
        'address',
        'opening_balance',
        'location_id',
    ];

    protected $appends = ['balance'];

    public function getBalanceAttribute()
    {
        if (array_key_exists('debits_sum', $this->attributes) && array_key_exists('credits_sum', $this->attributes)) {
            return ($this->opening_balance ?? 0) + ($this->attributes['credits_sum'] ?? 0) - ($this->attributes['debits_sum'] ?? 0);
        }

        static $apAccountIds = null;
        if ($apAccountIds === null) {
            $apAccountIds = \App\Models\Accounting\ChartOfAcc::where('sub_type', 'accounts-payable')->pluck('id');
        }
            
        $debits = \App\Models\Accounting\JournalEntryLine::where('payee_id', $this->id)
            ->whereIn('chart_of_acc_id', $apAccountIds)
            ->sum('debit');
            
        $credits = \App\Models\Accounting\JournalEntryLine::where('payee_id', $this->id)
            ->whereIn('chart_of_acc_id', $apAccountIds)
            ->sum('credit');

        return ($this->opening_balance ?? 0) + $credits - $debits;
    }
}
