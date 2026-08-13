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
            $table->uuid('fc_currency_id')->nullable()->after('chart_of_acc_id');
            $table->decimal('exchange_rate', 15, 6)->nullable()->after('fc_currency_id');
            $table->decimal('fc_debit', 15, 2)->nullable()->after('exchange_rate');
            $table->decimal('fc_credit', 15, 2)->nullable()->after('fc_debit');

            $table->foreign('fc_currency_id')->references('id')->on('currencies')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('journal_entry_lines', function (Blueprint $table) {
            $table->dropForeign(['fc_currency_id']);
            $table->dropColumn(['fc_currency_id', 'exchange_rate', 'fc_debit', 'fc_credit']);
        });
    }
};
