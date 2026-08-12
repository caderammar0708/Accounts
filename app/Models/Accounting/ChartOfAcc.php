<?php

namespace App\Models\Accounting;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use OwenIt\Auditing\Contracts\Auditable;

use App\Traits\BelongsToLocation;

class ChartOfAcc extends Model implements Auditable
{
    use HasUuids, \OwenIt\Auditing\Auditable, BelongsToLocation;

    protected $fillable = [
        'account_code',
        'name',
        'account_type',
        'sub_type',
        'balance',
        'currency_id',
        'description',
        'is_active',
        'parent_id',
        'is_locked',
        'location_id',
    ];

    protected $appends = ['is_system'];

    public function currency()
    {
        return $this->belongsTo(\App\Models\Currency::class, 'currency_id');
    }

    public function parent()
    {
        return $this->belongsTo(ChartOfAcc::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(ChartOfAcc::class, 'parent_id');
    }

    public function journalLines()
    {
        return $this->hasMany(JournalEntryLine::class, 'chart_of_acc_id');
    }

    /**
     * Get dynamically calculated account balance.
     * Assets & Expenses: Debit (+), Credit (-)
     * Liabilities, Equity, Income: Credit (+), Debit (-)
     */
    public function getBalanceAttribute()
    {
        if (array_key_exists('journal_lines_sum_debit', $this->attributes)) {
            $debit = $this->journal_lines_sum_debit ?? 0;
            $credit = $this->journal_lines_sum_credit ?? 0;
        } else {
            // Avoid N+1 queries during model serialization
            return $this->attributes['balance'] ?? 0;
        }

        $type = strtolower($this->account_type);
        if (in_array($type, ['asset', 'expense'])) {
            return $debit - $credit;
        } else {
            return $credit - $debit;
        }
    }

    public static function isCashLikeSubType(?string $subType): bool
    {
        return in_array(strtolower((string) $subType), ['cash-and-cash-equivalents', 'bank'], true);
    }

    public function isCashLike(): bool
    {
        return self::isCashLikeSubType($this->sub_type);
    }

    public static function getOrCreateDefault($subType, $companyId = null)
    {
        $normalizedSubType = strtolower((string) $subType);
        $matchingSubTypes = [$subType];

        if (self::isCashLikeSubType($normalizedSubType)) {
            $matchingSubTypes[] = 'cash-and-cash-equivalents';
            $matchingSubTypes[] = 'bank';
        }

        $account = self::whereIn('sub_type', array_unique($matchingSubTypes))->first();
        if ($account) {
            return $account;
        }

        $defaults = [
            'cash-and-cash-equivalents' => [
                'name' => 'Cash and Cash Equivalents',
                'account_type' => 'asset',
                'account_code' => '1000',
            ],
            'bank' => [
                'name' => 'Bank',
                'account_type' => 'asset',
                'account_code' => '1010',
            ],
            'accounts-receivable' => [
                'name' => 'Accounts Receivable (A/R)',
                'account_type' => 'asset',
                'account_code' => '1200',
            ],
            'accounts-payable' => [
                'name' => 'Accounts Payable (A/P)',
                'account_type' => 'liability',
                'account_code' => '2100',
            ],
            'inventory' => [
                'name' => 'Inventory Asset',
                'account_type' => 'asset',
                'account_code' => '1300',
            ],
            'cost-of-goods-sold' => [
                'name' => 'Cost of Goods Sold',
                'account_type' => 'expense',
                'account_code' => '5100',
            ],
            'retained-earnings' => [
                'name' => 'Retained Earnings',
                'account_type' => 'equity',
                'account_code' => '3900',
            ],
            'uncategorized-expense' => [
                'name' => 'Uncategorized Expense',
                'account_type' => 'expense',
                'account_code' => '5800',
            ],
            'uncategorized-income' => [
                'name' => 'Uncategorized Income',
                'account_type' => 'income',
                'account_code' => '4800',
            ],
            'opening-balance-equity' => [
                'name' => 'Opening Balance Equity',
                'account_type' => 'equity',
                'account_code' => '3000',
            ],
        ];

        $def = $defaults[$normalizedSubType] ?? (self::isCashLikeSubType($normalizedSubType) ? $defaults['cash-and-cash-equivalents'] : null) ?? [
            'name' => 'Default ' . ucfirst(str_replace('-', ' ', $subType)),
            'account_type' => 'expense',
            'account_code' => '9999',
        ];

        $code = $def['account_code'];
        $exists = self::where('account_code', $code)->exists();
        if ($exists) {
            $i = 1;
            while (self::where('account_code', $code . $i)->exists()) {
                $i++;
            }
            $code = $code . $i;
        }

        return self::create([
            'account_code' => $code,
            'name' => $def['name'],
            'account_type' => $def['account_type'],
            'sub_type' => $subType,
            'is_locked' => true,
            'is_active' => true,
        ]);
    }

    public function isSystemAccount(): bool
    {
        $systemNames = [
            'Opening Balance Equity',
            'Retained Earnings',
            'Accounts Receivable (A/R)',
            'Accounts Payable (A/P)',
            'Inventory Asset',
            'Cost of Goods Sold',
            'Uncategorized Expense',
            'Uncategorized Income',
        ];

        return in_array($this->name, $systemNames) && $this->is_locked;
    }

    public function getIsSystemAttribute(): bool
    {
        return $this->isSystemAccount();
    }
}
