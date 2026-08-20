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
        Schema::table('customers', function (Blueprint $table) {
            if (!Schema::hasColumn('customers', 'customer_type')) {
                $table->string('customer_type')->nullable()->after('company_name');
            }
            if (!Schema::hasColumn('customers', 'mobile')) {
                $table->string('mobile')->nullable()->after('phone_number');
            }
            if (!Schema::hasColumn('customers', 'fax')) {
                $table->string('fax')->nullable()->after('mobile');
            }
            if (!Schema::hasColumn('customers', 'website')) {
                $table->string('website')->nullable()->after('fax');
            }
            if (!Schema::hasColumn('customers', 'opening_balance_date')) {
                $table->date('opening_balance_date')->nullable()->after('opening_balance');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn(['customer_type', 'mobile', 'fax', 'website', 'opening_balance_date']);
        });
    }
};
