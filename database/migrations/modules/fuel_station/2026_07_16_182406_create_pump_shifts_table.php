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
        Schema::create('pump_shifts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('employee_id')->constrained('employees')->cascadeOnDelete();
            
            $table->dateTime('start_time');
            $table->dateTime('end_time')->nullable();
            
            $table->string('status')->default('open'); // open, closed
            
            $table->decimal('total_sales_value', 15, 2)->default(0);
            $table->decimal('cash_collected', 15, 2)->default(0);
            $table->decimal('credit_sales', 15, 2)->default(0);
            $table->decimal('transfers_collected', 15, 2)->default(0);
            $table->decimal('discrepancy', 15, 2)->default(0);
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pump_shifts');
    }
};
