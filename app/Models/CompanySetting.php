<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CompanySetting extends Model
{
    public static function current()
    {
        return once(fn() => \Illuminate\Support\Facades\Cache::rememberForever(
            'company_settings_' . \Illuminate\Support\Facades\DB::connection()->getDatabaseName(),
            fn() => self::firstOrCreate([])
        ));
    }

    protected static function booted()
    {
        static::saved(function ($settings) {
            \Illuminate\Support\Facades\Cache::forget('company_settings_' . \Illuminate\Support\Facades\DB::connection()->getDatabaseName());
        });
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
        'business_type',
        'branches_enabled',
        'pos_layout_enabled',
        'customer_layout_modal',
        'reports_display_as_buttons',
        'attachments_enabled',
    ];

    protected $casts = [
        'branches_enabled' => 'boolean',
        'pos_layout_enabled' => 'boolean',
        'customer_layout_modal' => 'boolean',
        'reports_display_as_buttons' => 'boolean',
        'attachments_enabled' => 'boolean',
    ];
}
