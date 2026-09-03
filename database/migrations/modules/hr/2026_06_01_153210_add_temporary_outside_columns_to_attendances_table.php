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
        Schema::table('attendances', function (Blueprint $table) {
            $table->time('outside_out')->nullable()->after('lunch_in');
            $table->time('outside_in')->nullable()->after('outside_out');
            $table->text('outside_reason')->nullable()->after('outside_in');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropColumn(['outside_out', 'outside_in', 'outside_reason']);
        });
    }
};
