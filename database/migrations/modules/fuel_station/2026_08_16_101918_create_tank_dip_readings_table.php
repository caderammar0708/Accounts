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
        Schema::create('tank_dip_readings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('company_id')->nullable()->constrained('companies')->cascadeOnDelete();
            $table->foreignId('tank_id')->constrained('tanks')->cascadeOnDelete();
            $table->date('date');
            $table->decimal('book_stock', 15, 4)->default(0);
            $table->decimal('physical_dip', 15, 4)->default(0);
            $table->decimal('variance', 15, 4)->default(0);
            $table->text('notes')->nullable();
            $table->foreignUuid('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tank_dip_readings');
    }
};
