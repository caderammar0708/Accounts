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
        Schema::table('journal_entry_lines', function (Blueprint $table) {
            if (!Schema::hasColumn('journal_entry_lines', 'fc_currency_id')) {
                $table->uuid('fc_currency_id')->nullable()->after('payee_type');
                if (Schema::hasTable('currencies')) {
                    $table->foreign('fc_currency_id')->references('id')->on('currencies')->onDelete('set null');
                }
            }
            if (!Schema::hasColumn('journal_entry_lines', 'exchange_rate')) {
                $table->decimal('exchange_rate', 15, 6)->nullable()->after('fc_currency_id');
            }
            if (!Schema::hasColumn('journal_entry_lines', 'fc_debit')) {
                $table->decimal('fc_debit', 15, 2)->nullable()->after('exchange_rate');
            }
            if (!Schema::hasColumn('journal_entry_lines', 'fc_credit')) {
                $table->decimal('fc_credit', 15, 2)->nullable()->after('fc_debit');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('journal_entry_lines', function (Blueprint $table) {
            if (Schema::hasColumn('journal_entry_lines', 'fc_currency_id')) {
                try {
                    $table->dropForeign(['fc_currency_id']);
                } catch (\Throwable $e) {}
                $table->dropColumn('fc_currency_id');
            }
            if (Schema::hasColumn('journal_entry_lines', 'exchange_rate')) {
                $table->dropColumn('exchange_rate');
            }
            if (Schema::hasColumn('journal_entry_lines', 'fc_debit')) {
                $table->dropColumn('fc_debit');
            }
            if (Schema::hasColumn('journal_entry_lines', 'fc_credit')) {
                $table->dropColumn('fc_credit');
            }
        });
    }
};
