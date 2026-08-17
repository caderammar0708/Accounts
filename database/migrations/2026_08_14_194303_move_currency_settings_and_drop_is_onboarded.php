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
            if (!Schema::hasColumn('companies', 'multi_currency_enabled')) {
                $table->boolean('multi_currency_enabled')->default(false);
            }
            if (!Schema::hasColumn('companies', 'home_currency_id')) {
                $table->uuid('home_currency_id')->nullable();
                $table->foreign('home_currency_id')->references('id')->on('currencies')->onDelete('set null');
            }
        });

        // 2. Data Migration: Copy from company_settings to companies
        $settings = \Illuminate\Support\Facades\DB::table('company_settings')->first();
        if ($settings) {
            $update = [];
            if (isset($settings->multi_currency_enabled)) {
                $update['multi_currency_enabled'] = $settings->multi_currency_enabled;
            }
            if (isset($settings->home_currency_id)) {
                $update['home_currency_id'] = $settings->home_currency_id;
            }
            if (!empty($update)) {
                \Illuminate\Support\Facades\DB::table('companies')->update($update);
            }
        }

        // 3. Drop fields from company_settings
        Schema::table('company_settings', function (Blueprint $table) {
            if (Schema::hasColumn('company_settings', 'home_currency_id')) {
                try {
                    $table->dropForeign(['home_currency_id']);
                } catch (\Throwable $e) {}
                $table->dropColumn('home_currency_id');
            }
            if (Schema::hasColumn('company_settings', 'multi_currency_enabled')) {
                $table->dropColumn('multi_currency_enabled');
            }
        });

        // 4. Drop is_onboarded from companies
        if (Schema::hasColumn('companies', 'is_onboarded')) {
            Schema::table('companies', function (Blueprint $table) {
                $table->dropColumn('is_onboarded');
            });
        }
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
