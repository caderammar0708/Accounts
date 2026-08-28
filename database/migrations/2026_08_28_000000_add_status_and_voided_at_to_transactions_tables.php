<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $tablesWithStatus = [
            'journal_entries',
            'sales_invoices',
            'credit_invoices',
            'bills',
            'payments',
            'cheques',
            'bank_deposits',
            'cheque_deposits',
            'invoice_returns',
            'bill_returns',
        ];

        foreach ($tablesWithStatus as $tableName) {
            if (Schema::hasTable($tableName)) {
                Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                    if (!Schema::hasColumn($tableName, 'voided_at')) {
                        $table->timestamp('voided_at')->nullable()->after('status');
                    }
                });
            }
        }

        $tablesNeedingStatus = [
            'receive_payments',
            'transfers',
            'bill_payments',
            'inventory_quantity_adjustments',
        ];

        foreach ($tablesNeedingStatus as $tableName) {
            if (Schema::hasTable($tableName)) {
                Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                    if (!Schema::hasColumn($tableName, 'status')) {
                        $table->string('status')->default('posted')->after('id');
                    }
                    if (!Schema::hasColumn($tableName, 'voided_at')) {
                        $table->timestamp('voided_at')->nullable()->after('status');
                    }
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $allTables = [
            'receive_payments',
            'transfers',
            'bill_payments',
            'inventory_quantity_adjustments',
            'journal_entries',
            'sales_invoices',
            'credit_invoices',
            'bills',
            'payments',
            'cheques',
            'bank_deposits',
            'cheque_deposits',
            'invoice_returns',
            'bill_returns',
        ];

        foreach ($allTables as $tableName) {
            if (Schema::hasTable($tableName)) {
                Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                    if (Schema::hasColumn($tableName, 'voided_at')) {
                        $table->dropColumn('voided_at');
                    }
                });
            }
        }

        $tablesNeedingStatus = [
            'receive_payments',
            'transfers',
            'bill_payments',
            'inventory_quantity_adjustments',
        ];

        foreach ($tablesNeedingStatus as $tableName) {
            if (Schema::hasTable($tableName)) {
                Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                    if (Schema::hasColumn($tableName, 'status')) {
                        $table->dropColumn('status');
                    }
                });
            }
        }
    }
};
