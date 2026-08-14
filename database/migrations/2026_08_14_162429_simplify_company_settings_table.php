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
            $columnsToDrop = [];
            
            if (Schema::hasColumn('company_settings', 'fuel_station_enabled')) {
                $columnsToDrop[] = 'fuel_station_enabled';
            }
            if (Schema::hasColumn('company_settings', 'warranty_layout_enabled')) {
                $columnsToDrop[] = 'warranty_layout_enabled';
            }
            if (Schema::hasColumn('company_settings', 'job_layout_enabled')) {
                $columnsToDrop[] = 'job_layout_enabled';
            }
            if (Schema::hasColumn('company_settings', 'vehicles_enabled')) {
                $columnsToDrop[] = 'vehicles_enabled';
            }
            
            if (!empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
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
