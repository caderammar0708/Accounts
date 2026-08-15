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
        // 1. Add fields to companies
        Schema::table('companies', function (Blueprint $table) {
            $table->boolean('multi_currency_enabled')->default(false);
            $table->uuid('home_currency_id')->nullable();
            
            $table->foreign('home_currency_id')->references('id')->on('currencies')->onDelete('set null');
        });

        // 2. Data Migration: Copy from company_settings to companies
        $settings = \Illuminate\Support\Facades\DB::table('company_settings')->first();
        if ($settings) {
            \Illuminate\Support\Facades\DB::table('companies')->update([
                'multi_currency_enabled' => $settings->multi_currency_enabled,
                'home_currency_id' => $settings->home_currency_id,
            ]);
        }

        // 3. Drop fields from company_settings
        Schema::table('company_settings', function (Blueprint $table) {
            $table->dropForeign(['home_currency_id']);
            $table->dropColumn(['multi_currency_enabled', 'home_currency_id']);
        });

        // 4. Drop is_onboarded from companies
        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn('is_onboarded');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->boolean('is_onboarded')->default(false);
        });

        Schema::table('company_settings', function (Blueprint $table) {
            $table->boolean('multi_currency_enabled')->default(false);
            $table->uuid('home_currency_id')->nullable();
            $table->foreign('home_currency_id')->references('id')->on('currencies')->onDelete('set null');
        });

        $company = \Illuminate\Support\Facades\DB::table('companies')->first();
        if ($company) {
            \Illuminate\Support\Facades\DB::table('company_settings')->update([
                'multi_currency_enabled' => $company->multi_currency_enabled,
                'home_currency_id' => $company->home_currency_id,
            ]);
        }

        Schema::table('companies', function (Blueprint $table) {
            $table->dropForeign(['home_currency_id']);
            $table->dropColumn(['multi_currency_enabled', 'home_currency_id']);
        });
    }
};
