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
        Schema::table('employees', function (Blueprint $table) {
            $table->string('salary_type')->nullable()->after('salary');
            $table->decimal('hours_per_day', 8, 2)->nullable()->after('salary_type');
            $table->decimal('sales_commission_rate', 5, 2)->nullable()->after('hours_per_day');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn(['salary_type', 'hours_per_day', 'sales_commission_rate']);
        });
    }
};
