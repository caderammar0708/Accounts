<?php

namespace App\Models\Accounting;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class BankImportLine extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'bank_import_id',
        'transaction_date',
        'description',
        'reference',
        'amount',
        'status',
        'assigned_account_id',
        'journal_entry_id'
    ];

    public function import()
    {
        return $this->belongsTo(BankImport::class, 'bank_import_id');
    }

    public function assignedAccount()
    {
        return $this->belongsTo(ChartOfAcc::class, 'assigned_account_id');
    }

    public function journalEntry()
    {
        return $this->belongsTo(JournalEntry::class, 'journal_entry_id');
    }
}
