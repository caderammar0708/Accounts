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
        Schema::create('pump_shift_receive_payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('pump_shift_id');
            $table->uuid('customer_id');
            $table->string('description')->nullable();
            $table->decimal('amount', 15, 2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pump_shift_receive_payments');
    }
};
