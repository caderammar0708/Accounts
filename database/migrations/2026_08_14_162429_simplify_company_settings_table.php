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
        Schema::table('company_settings', function (Blueprint $table) {
            $table->dropColumn([
                'fuel_station_enabled',
                'warranty_layout_enabled',
                'job_layout_enabled',
                'vehicles_enabled'
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('company_settings', function (Blueprint $table) {
            $table->boolean('fuel_station_enabled')->default(false);
            $table->boolean('warranty_layout_enabled')->default(false);
            $table->boolean('job_layout_enabled')->default(false);
            $table->boolean('vehicles_enabled')->default(false);
        });
    }
};
