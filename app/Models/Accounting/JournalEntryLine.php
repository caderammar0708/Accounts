<?php

namespace App\Models\Accounting;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use OwenIt\Auditing\Contracts\Auditable;

class JournalEntryLine extends Model implements Auditable
{
    use HasUuids, \OwenIt\Auditing\Auditable;

   protected $fillable = [
    'journal_entry_id',
    'chart_of_acc_id',
    'payee_id',
    'payee_type',
    'fc_currency_id',
    'exchange_rate',
    'fc_debit',
    'fc_credit',
    'debit',
    'credit',
    'memo',
];

    public function journalEntry()
    {
        return $this->belongsTo(JournalEntry::class);
    }

    public function account()
    {
        return $this->belongsTo(ChartOfAcc::class, 'chart_of_acc_id');
    }
}
