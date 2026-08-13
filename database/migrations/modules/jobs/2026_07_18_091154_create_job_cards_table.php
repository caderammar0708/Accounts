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
        Schema::create('job_cards', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('customer_id')->constrained()->onDelete('cascade');
            $table->uuid('device_id')->nullable()->constrained()->onDelete('set null');
            
            $table->string('job_card_number');
            $table->date('service_date');
            $table->text('complaint')->nullable();
            $table->string('technician_assigned')->nullable();
            $table->date('estimated_delivery_date')->nullable();
            $table->decimal('estimated_cost', 15, 2)->nullable();
            
            $table->json('photos')->nullable();
            $table->text('customer_signature')->nullable();
            
            $table->string('status')->default('Pending'); // Pending, Diagnosing, Waiting for Parts, In Progress, Ready, Delivered, Cancelled
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('job_cards');
    }
};
