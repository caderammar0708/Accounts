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
        if (Schema::hasTable('print_settings') && !Schema::hasColumn('print_settings', 'show_logo')) {
            Schema::table('print_settings', function (Blueprint $table) {
                $table->boolean('show_logo')->default(true);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('print_settings', function (Blueprint $table) {
            $table->dropColumn('show_logo');
        });
    }
};
