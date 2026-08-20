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
        Schema::table('suppliers', function (Blueprint $table) {
            if (!Schema::hasColumn('suppliers', 'supplier_type')) {
                $table->string('supplier_type')->nullable()->after('company_name');
            }
            if (!Schema::hasColumn('suppliers', 'mobile')) {
                $table->string('mobile')->nullable()->after('phone_number');
            }
            if (!Schema::hasColumn('suppliers', 'fax')) {
                $table->string('fax')->nullable()->after('mobile');
            }
            if (!Schema::hasColumn('suppliers', 'website')) {
                $table->string('website')->nullable()->after('fax');
            }
            if (!Schema::hasColumn('suppliers', 'opening_balance_date')) {
                $table->date('opening_balance_date')->nullable()->after('opening_balance');
            }
        });

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
                $table->string('employment_type')->nullable()->after('salary_type');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('suppliers', function (Blueprint $table) {
            $table->dropColumn(['supplier_type', 'mobile', 'fax', 'website', 'opening_balance_date']);
        });

        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn(['phone', 'mobile', 'department', 'employment_type']);
        });
    }
};
