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
        if (Schema::hasTable('company_settings') && !Schema::hasColumn('company_settings', 'business_type')) {
            Schema::table('company_settings', function (Blueprint $table) {
                $table->string('business_type')->default('Normal');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('company_settings', 'business_type')) {
            Schema::table('company_settings', function (Blueprint $table) {
                $table->dropColumn('business_type');
            });
        }
    }
};
