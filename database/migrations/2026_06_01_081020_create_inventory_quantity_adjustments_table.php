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
        Schema::create('inventory_quantity_adjustments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->date('adjustment_date');
            $table->string('reference_number')->nullable();
            $table->string('adjustment_reason')->nullable();
            $table->foreignUuid('inventory_adjustment_account_id')->nullable()->constrained('chart_of_accs', indexName: 'fk_inv_adj_acc_id')->nullOnDelete();
            $table->text('memo')->nullable();
            $table->timestamps();
        });

        Schema::create('inventory_quantity_adjustment_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('inventory_quantity_adjustment_id')->constrained('inventory_quantity_adjustments', 'id', 'fk_inv_qty_adj_id')->cascadeOnDelete();
            $table->foreignUuid('item_id')->constrained('items')->cascadeOnDelete();
            $table->string('description')->nullable();
            $table->decimal('qty_on_hand', 15, 2)->default(0);
            $table->decimal('new_qty', 15, 2)->default(0);
            $table->decimal('change_in_qty', 15, 2)->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_quantity_adjustments');
        Schema::dropIfExists('inventory_quantity_adjustment_items');
    }
};
