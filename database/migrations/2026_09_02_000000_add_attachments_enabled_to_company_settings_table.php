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
        if (Schema::hasTable('company_settings')) {
            Schema::table('company_settings', function (Blueprint $table) {
                if (!Schema::hasColumn('company_settings', 'attachments_enabled')) {
                    $table->boolean('attachments_enabled')->default(true)->after('reports_display_as_buttons');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('company_settings')) {
            Schema::table('company_settings', function (Blueprint $table) {
                if (Schema::hasColumn('company_settings', 'attachments_enabled')) {
                    $table->dropColumn('attachments_enabled');
                }
            });
        }
    }
};
