<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Models\Accounting\ChartOfAcc;
use App\Models\Accounting\JournalEntryLine;

class Customer extends Model
{
    use HasUuids;

    protected $fillable = [
    'display_name',
    'first_name',
    'last_name',
    'company_name',
    'email',
    'phone_number',
    'nic',
    'passport',
    'address',
    'vehicle_id',
    'customer_number',
    'tax_id',
    'opening_balance',
];

    protected $appends = ['balance'];

    /**
     * Get all of the customer's devices.
     */
    public function devices()
    {
        return $this->hasMany(Device::class);
    }

    public function getBalanceAttribute()
    {
        if (array_key_exists('debits_sum', $this->attributes) && array_key_exists('credits_sum', $this->attributes)) {
            return ($this->opening_balance ?? 0) + ($this->attributes['debits_sum'] ?? 0) - ($this->attributes['credits_sum'] ?? 0);
        }

        static $arAccountIds = null;
        if ($arAccountIds === null) {
            $arAccountIds = ChartOfAcc::where('sub_type', 'accounts-receivable')->pluck('id');
        }
            
        $debits = JournalEntryLine::where('payee_id', $this->id)
            ->whereIn('chart_of_acc_id', $arAccountIds)
            ->sum('debit');
            
        $credits = JournalEntryLine::where('payee_id', $this->id)
            ->whereIn('chart_of_acc_id', $arAccountIds)
            ->sum('credit');

        return ($this->opening_balance ?? 0) + $debits - $credits;
    }
}
