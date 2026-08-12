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
        'pos_layout_enabled',
        'warranty_layout_enabled',
        'job_layout_enabled',
        'customer_layout_modal',
        'reports_display_as_buttons',
        'vehicles_enabled',
        'branches_enabled',
        'multi_currency_enabled',
        'home_currency_id',
    ];

    protected $casts = [
        'pos_layout_enabled' => 'boolean',
        'warranty_layout_enabled' => 'boolean',
        'job_layout_enabled' => 'boolean',
        'customer_layout_modal' => 'boolean',
        'reports_display_as_buttons' => 'boolean',
        'vehicles_enabled' => 'boolean',
        'branches_enabled' => 'boolean',
    ];
}
