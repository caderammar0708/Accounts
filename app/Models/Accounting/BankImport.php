<?php

namespace App\Models\Accounting;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class BankImport extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'company_id',
        'bank_account_id',
        'import_date',
        'filename',
        'status',
        'created_by'
    ];

    public function lines()
    {
        return $this->hasMany(BankImportLine::class);
    }
}
