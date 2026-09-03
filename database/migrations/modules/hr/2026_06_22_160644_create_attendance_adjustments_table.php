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
        Schema::create('attendance_adjustments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attendance_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('adjusted_by')->constrained('users')->cascadeOnDelete();
            
            $table->time('old_check_in')->nullable();
            $table->time('new_check_in')->nullable();
            
            $table->time('old_lunch_out')->nullable();
            $table->time('new_lunch_out')->nullable();
            
            $table->time('old_lunch_in')->nullable();
            $table->time('new_lunch_in')->nullable();
            
            $table->time('old_check_out')->nullable();
            $table->time('new_check_out')->nullable();
            
            $table->string('old_status')->nullable();
            $table->string('new_status')->nullable();
            
            $table->text('reason')->nullable();
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendance_adjustments');
    }
};
