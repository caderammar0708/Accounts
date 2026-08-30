<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The tables to add location_id column to.
     */
    protected array $tables = [
        'sales_invoices',
        'credit_invoices',
        'invoice_returns',
        'receive_payments',
        'bills',
        'bill_payments',
        'bill_returns',
        'cheques',
        'cheque_deposits',
        'bank_deposits',
        'transfers',
        'journal_entries',
        'inventory_quantity_adjustments',
        'customers',
        'suppliers',
        'chart_of_accs',
        'vehicles',
        'job_cards',
        'items',
        'warranties',
        'warranty_claims',
        'employees',
        'payments',
    ];

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        foreach ($this->tables as $tableName) {
            if (Schema::hasTable($tableName) && !Schema::hasColumn($tableName, 'location_id')) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->foreignId('location_id')->nullable()->after('id')->constrained('locations')->nullOnDelete();
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        foreach ($this->tables as $tableName) {
            if (Schema::hasTable($tableName) && Schema::hasColumn($tableName, 'location_id')) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->dropForeign(['location_id']);
                    $table->dropColumn('location_id');
                });
            }
        }
    }
};
