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
            $table->boolean('is_short_leave')->default(false)->after('days_per_year');
            $table->enum('short_leave_limit_type', ['month', 'week'])->nullable()->after('is_short_leave');
            $table->integer('short_leave_limit')->nullable()->after('short_leave_limit_type');
            $table->integer('short_leave_time_minutes')->nullable()->after('short_leave_limit');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('leave_types', function (Blueprint $table) {
            $table->dropColumn([
                'is_short_leave',
                'short_leave_limit_type',
                'short_leave_limit',
                'short_leave_time_minutes',
            ]);
        });
    }
};
