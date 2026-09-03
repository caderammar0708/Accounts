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
        Schema::create('advance_salaries', function (Blueprint $table) {
            $table->id();
            $table->uuid('employee_id');
            $table->decimal('amount', 15, 2);
            $table->enum('recovery_mode', ['Lumpsum', 'Installment'])->default('Lumpsum');
            $table->integer('installments')->default(1);
            $table->decimal('recovered_amount', 15, 2)->default(0.00);
            $table->integer('recover_from_month');
            $table->integer('recover_from_year');
            $table->enum('status', ['Approved', 'Fully Recovered', 'Cancelled'])->default('Approved');
            $table->timestamps();

            $table->foreign('employee_id')->references('id')->on('employees')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('advance_salaries');
    }
};
