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
            $table->string('code')->nullable()->unique()->after('name');
            $table->boolean('applies_sl_joining_rules')->default(false)->after('days_per_year');
            $table->boolean('applies_probation_half_rate')->default(false)->after('applies_sl_joining_rules');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('leave_types', function (Blueprint $table) {
            $table->dropColumn(['code', 'applies_sl_joining_rules', 'applies_probation_half_rate']);
        });
    }
};
