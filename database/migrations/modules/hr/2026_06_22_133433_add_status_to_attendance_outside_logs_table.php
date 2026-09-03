<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendance_outside_logs', function (Blueprint $table) {
            $table->enum('status', ['pending', 'approved', 'rejected', 'cancelled'])->default('pending')->after('in_time');
        });
    }

    public function down(): void
    {
        Schema::table('attendance_outside_logs', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }
};
