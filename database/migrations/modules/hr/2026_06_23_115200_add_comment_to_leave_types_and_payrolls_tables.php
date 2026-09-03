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
        Schema::table('leave_types', function (Blueprint $table) {
            $table->text('comment')->nullable()->after('applies_probation_half_rate');
        });

        Schema::table('payrolls', function (Blueprint $table) {
            $table->text('comment')->nullable()->after('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('leave_types', function (Blueprint $table) {
            $table->dropColumn('comment');
        });

        Schema::table('payrolls', function (Blueprint $table) {
            $table->dropColumn('comment');
        });
    }
};
