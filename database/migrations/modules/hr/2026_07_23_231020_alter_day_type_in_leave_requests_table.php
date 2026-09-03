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
        // Modify the enum to include 'Short Leave'
        \Illuminate\Support\Facades\DB::statement("ALTER TABLE leave_requests MODIFY COLUMN day_type ENUM('Full Day', 'Half Day', 'Short Leave') DEFAULT 'Full Day'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back (Note: if there are existing 'Short Leave' records, this down migration might fail)
        \Illuminate\Support\Facades\DB::statement("ALTER TABLE leave_requests MODIFY COLUMN day_type ENUM('Full Day', 'Half Day') DEFAULT 'Full Day'");
    }
};
