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
            if (!Schema::hasColumn('employees', 'phone')) {
                $table->string('phone')->nullable()->after('email');
            }
            if (!Schema::hasColumn('employees', 'mobile')) {
                $table->string('mobile')->nullable()->after('phone');
            }
            if (!Schema::hasColumn('employees', 'department')) {
                $table->string('department')->nullable()->after('designation');
            }
            if (!Schema::hasColumn('employees', 'employment_type')) {
                $table->string('employment_type')->nullable()->after('sales_commission_rate');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $columnsToDrop = [];
            foreach (['phone', 'mobile', 'department', 'employment_type'] as $col) {
                if (Schema::hasColumn('employees', $col)) {
                    $columnsToDrop[] = $col;
                }
            }
            if (!empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};
