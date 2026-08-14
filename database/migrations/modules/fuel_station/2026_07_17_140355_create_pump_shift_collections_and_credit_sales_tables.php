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
        Schema::create('pump_shift_collections', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('pump_shift_id')->constrained('pump_shifts')->cascadeOnDelete();
            $table->foreignUuid('chart_of_acc_id')->constrained('chart_of_accs')->cascadeOnDelete();
            $table->string('description')->nullable();
            $table->decimal('amount', 15, 2);
            $table->timestamps();
        });

        Schema::create('pump_shift_credit_sales', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('pump_shift_id')->constrained('pump_shifts')->cascadeOnDelete();
            $table->foreignUuid('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->string('description')->nullable();
            $table->decimal('amount', 15, 2);
            $table->timestamps();
        });

        Schema::table('pump_shifts', function (Blueprint $table) {
            $table->dropColumn(['cash_collected', 'credit_sales', 'transfers_collected']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pump_shifts', function (Blueprint $table) {
            $table->decimal('cash_collected', 15, 2)->default(0);
            $table->decimal('credit_sales', 15, 2)->default(0);
            $table->decimal('transfers_collected', 15, 2)->default(0);
        });

        Schema::dropIfExists('pump_shift_credit_sales');
        Schema::dropIfExists('pump_shift_collections');
    }
};
