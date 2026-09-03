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
        Schema::create('salary_revisions', function (Blueprint $table) {
            $table->id();
            $table->uuid('employee_id');
            $table->decimal('old_basic_salary', 15, 2);
            $table->decimal('new_basic_salary', 15, 2);
            $table->json('old_allowances')->nullable();
            $table->json('new_allowances')->nullable();
            $table->json('old_deductions')->nullable();
            $table->json('new_deductions')->nullable();
            $table->string('changed_by');
            $table->timestamps();

            $table->foreign('employee_id')->references('id')->on('employees')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('salary_revisions');
    }
};
