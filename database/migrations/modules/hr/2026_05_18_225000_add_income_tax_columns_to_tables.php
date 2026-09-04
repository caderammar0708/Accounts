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
        Schema::table('salary_structures', function (Blueprint $table) {
            $table->decimal('income_tax', 15, 2)->default(0.00)->after('leave_deduction');
        });

        Schema::table('payslips', function (Blueprint $table) {
            $table->decimal('income_tax', 15, 2)->default(0.00)->after('leave_deduction');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('salary_structures', function (Blueprint $table) {
            $table->dropColumn('income_tax');
        });

        Schema::table('payslips', function (Blueprint $table) {
            $table->dropColumn('income_tax');
        });
    }
};
