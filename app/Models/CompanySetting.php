<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CompanySetting extends Model
{
    public static function current()
    {
        return once(fn() => \Illuminate\Support\Facades\Cache::rememberForever(
            'company_settings_' . \Illuminate\Support\Facades\DB::connection()->getDatabaseName(),
            fn() => self::with('homeCurrency')->firstOrCreate([])
        ));
    }

    protected static function booted()
    {
        static::saved(function ($settings) {
            \Illuminate\Support\Facades\Cache::forget('company_settings_' . \Illuminate\Support\Facades\DB::connection()->getDatabaseName());
        });
    }

    public function homeCurrency()
    {
        return $this->belongsTo(\App\Models\Currency::class, 'home_currency_id');
    }
    protected $fillable = [
        'low_stock_to_emails',
        'low_stock_cc_emails',
        'low_stock_bcc_emails',
        'acct_method', 
        'fin_year_start',
        'tax_year_start',
        'books_lock_date',
        'books_lock_pin',
        'tax_form',
        'warn_dup_cheque',
        'warn_dup_bill',
        'warn_dup_journal',
        'sign_out_inactive',
        'multi_currency_enabled',
        'home_currency_id',
        'business_type',
    ];

    protected $casts = [
        'multi_currency_enabled' => 'boolean',
    ];
}
