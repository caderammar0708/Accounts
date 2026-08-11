<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CompanySetting extends Model
{
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
    ];

    protected $casts = [
        'pos_layout_enabled' => 'boolean',
        'warranty_layout_enabled' => 'boolean',
        'job_layout_enabled' => 'boolean',
        'customer_layout_modal' => 'boolean',
        'reports_display_as_buttons' => 'boolean',
        'vehicles_enabled' => 'boolean',
    ];
}
