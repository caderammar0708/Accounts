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
        $tables = [
            'receive_payments',
            'payments',
            'bills',
            'bill_payments',
            'bank_deposits',
            'journal_entries',
            'transfers',
        ];

        foreach ($tables as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->uuid('currency_id')->nullable();
                $table->decimal('exchange_rate', 15, 6)->nullable();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = [
            'receive_payments',
            'payments',
            'bills',
            'bill_payments',
            'bank_deposits',
            'journal_entries',
            'transfers',
        ];

        foreach ($tables as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->dropColumn(['currency_id', 'exchange_rate']);
            });
        }
    }
};
