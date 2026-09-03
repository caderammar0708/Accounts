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
            $table->decimal('bonus', 15, 2)->default(0.00)->after('ot_rate_per_hour');
            $table->decimal('loan_deduction', 15, 2)->default(0.00)->after('bonus');
            $table->decimal('leave_deduction', 15, 2)->default(0.00)->after('loan_deduction');
        });

        Schema::table('payslips', function (Blueprint $table) {
            $table->decimal('bonus', 15, 2)->default(0.00)->after('etf');
            $table->decimal('loan_deduction', 15, 2)->default(0.00)->after('bonus');
            $table->decimal('leave_deduction', 15, 2)->default(0.00)->after('loan_deduction');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('salary_structures', function (Blueprint $table) {
            $table->dropColumn(['bonus', 'loan_deduction', 'leave_deduction']);
        });

        Schema::table('payslips', function (Blueprint $table) {
            $table->dropColumn(['bonus', 'loan_deduction', 'leave_deduction']);
        });
    }
};
