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
        Schema::dropIfExists('warranty_policy_items');
        Schema::create('warranty_policy_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('warranty_policy_id')->constrained('warranty_policies')->onDelete('cascade');
            $table->string('item_type');
            $table->foreignUuid('item_id')->constrained('items')->onDelete('cascade');
            $table->timestamps();

            $table->unique(['warranty_policy_id', 'item_type', 'item_id'], 'warranty_policy_items_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('warranty_policy_items');
    }
};
