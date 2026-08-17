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
        Schema::table('credit_invoices', function (Blueprint $table) {
            $table->uuid('source_id')->nullable()->after('customer_id');
            $table->string('source_type')->nullable()->after('source_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('credit_invoices', function (Blueprint $table) {
            $table->dropColumn(['source_id', 'source_type']);
        });
    }
};
