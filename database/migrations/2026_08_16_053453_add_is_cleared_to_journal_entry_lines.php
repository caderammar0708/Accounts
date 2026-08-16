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
            $table->boolean('is_cleared')->default(false)->after('credit');
            $table->uuid('bank_reconciliation_id')->nullable()->after('is_cleared');
            // We won't add a foreign key constraint to bank_reconciliation_id to avoid circular dependencies in case reconciliations are deleted, 
            // or we can add it later. It's safer to just have it as a nullable reference.
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('journal_entry_lines', function (Blueprint $table) {
            $table->dropColumn(['is_cleared', 'bank_reconciliation_id']);
        });
    }
};
