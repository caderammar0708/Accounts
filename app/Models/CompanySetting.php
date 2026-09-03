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
        'hr_module_enabled',
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
        'remote_checkin_auto_approve',
        'prayer_break_auto_approve',
        'receiver_email',
        'cc_emails',
        'bcc_emails',
        'basic_salary_percentage',
        'allowance_percentage',
        'epf_employee_percentage',
        'epf_employer_percentage',
        'etf_employer_percentage',
        'qr_type',
        'qr_dynamic_interval',
    ];

    protected $casts = [
        'hr_module_enabled' => 'boolean',
        'branches_enabled' => 'boolean',
        'pos_layout_enabled' => 'boolean',
        'customer_layout_modal' => 'boolean',
        'reports_display_as_buttons' => 'boolean',
        'attachments_enabled' => 'boolean',
        'remote_checkin_auto_approve' => 'boolean',
        'prayer_break_auto_approve' => 'boolean',
        'basic_salary_percentage' => 'float',
        'allowance_percentage' => 'float',
        'epf_employee_percentage' => 'float',
        'epf_employer_percentage' => 'float',
        'etf_employer_percentage' => 'float',
    ];
}
