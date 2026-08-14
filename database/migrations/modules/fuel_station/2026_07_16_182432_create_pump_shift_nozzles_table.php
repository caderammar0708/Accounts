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
        Schema::create('pump_shift_nozzles', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('pump_shift_id')->constrained('pump_shifts')->cascadeOnDelete();
            $table->foreignId('nozzle_id')->constrained('nozzles')->cascadeOnDelete();
            
            $table->decimal('opening_reading', 15, 3);
            $table->decimal('closing_reading', 15, 3)->nullable();
            $table->decimal('price_per_liter', 10, 2)->default(0);
            $table->decimal('volume_sold', 15, 3)->nullable();
            $table->decimal('total_value', 15, 2)->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pump_shift_nozzles');
    }
};
