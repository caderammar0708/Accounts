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
        Schema::create('employees', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('mobile')->nullable();
            $table->string('employee_id')->nullable();
            $table->text('address')->nullable();
            $table->string('designation')->nullable();
            $table->string('department')->nullable();
            $table->decimal('salary', 15, 2)->nullable();
            $table->string('salary_type')->nullable();
            $table->decimal('hours_per_day', 8, 2)->nullable();
            $table->decimal('sales_commission_rate', 5, 2)->nullable();
            $table->string('employment_type')->nullable();
            $table->date('join_date')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
