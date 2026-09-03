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
        'supplier_type',
        'email',
        'phone_number',
        'mobile',
        'fax',
        'website',
        'tax_id',
        'address',
        'opening_balance',
        'opening_balance_date',
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
        $debits = \App\Models\Accounting\JournalEntryLine::join('journal_entries', 'journal_entry_lines.journal_entry_id', '=', 'journal_entries.id')
            ->where(function($q) {
                $q->where('journal_entry_lines.payee_id', $this->id)
                  ->orWhere('journal_entries.payee_id', $this->id);
            })
            ->whereIn('journal_entry_lines.chart_of_acc_id', $apAccountIds)
            ->sum('journal_entry_lines.debit');
            
        $credits = \App\Models\Accounting\JournalEntryLine::join('journal_entries', 'journal_entry_lines.journal_entry_id', '=', 'journal_entries.id')
            ->where(function($q) {
                $q->where('journal_entry_lines.payee_id', $this->id)
                  ->orWhere('journal_entries.payee_id', $this->id);
            })
            ->whereIn('journal_entry_lines.chart_of_acc_id', $apAccountIds)
            ->sum('journal_entry_lines.credit');

        return ($this->opening_balance ?? 0) + $credits - $debits;
    }
}
