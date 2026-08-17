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
        if (Schema::hasTable('sales_invoices') && !Schema::hasColumn('sales_invoices', 'created_by')) {
            Schema::table('sales_invoices', function (Blueprint $table) {
                $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('sales_invoices') && Schema::hasColumn('sales_invoices', 'created_by')) {
            Schema::table('sales_invoices', function (Blueprint $table) {
                $table->dropForeign(['created_by']);
                $table->dropColumn('created_by');
            });
        }
    }
};
