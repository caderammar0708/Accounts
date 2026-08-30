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
        Schema::create('stock_shifts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('location_id')->nullable()->constrained('locations')->nullOnDelete();
            $table->foreignUuid('employee_id')->constrained('employees')->cascadeOnDelete();
            
            $table->dateTime('start_time');
            $table->dateTime('end_time')->nullable();
            
            $table->string('status')->default('open'); // open, pending_collection, closed
            
            $table->decimal('total_sales_value', 15, 2)->default(0);
            $table->decimal('cash_collected', 15, 2)->default(0);
            $table->decimal('credit_sales', 15, 2)->default(0);
            $table->decimal('transfers_collected', 15, 2)->default(0);
            $table->decimal('discrepancy', 15, 2)->default(0);
            $table->text('notes')->nullable();
            
            $table->timestamps();
        });

        Schema::create('stock_shift_items', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('stock_shift_id')->constrained('stock_shifts')->cascadeOnDelete();
            $table->foreignUuid('item_id')->constrained('items')->cascadeOnDelete();
            
            $table->decimal('issued_qty', 15, 3)->default(0);
            $table->decimal('returned_qty', 15, 3)->nullable();
            $table->decimal('sold_qty', 15, 3)->nullable();
            $table->decimal('unit_price', 15, 2)->default(0);
            $table->decimal('total_value', 15, 2)->nullable();

            $table->timestamps();
        });

        Schema::create('stock_shift_collections', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('stock_shift_id')->constrained('stock_shifts')->cascadeOnDelete();
            $table->foreignUuid('chart_of_acc_id')->constrained('chart_of_accs')->cascadeOnDelete();
            $table->string('description')->nullable();
            $table->decimal('amount', 15, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('stock_shift_credit_sales', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('stock_shift_id')->constrained('stock_shifts')->cascadeOnDelete();
            $table->foreignUuid('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->string('description')->nullable();
            $table->decimal('amount', 15, 2)->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_shift_credit_sales');
        Schema::dropIfExists('stock_shift_collections');
        Schema::dropIfExists('stock_shift_items');
        Schema::dropIfExists('stock_shifts');
    }
};
