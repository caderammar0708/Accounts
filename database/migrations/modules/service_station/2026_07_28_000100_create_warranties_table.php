<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('warranties', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('warranty_policy_id')->constrained()->onDelete('cascade');
            $table->foreignUuid('invoice_item_id')->constrained('sales_invoice_items')->onDelete('cascade');
            $table->unsignedBigInteger('vehicle_id')->nullable();
            $table->foreign('vehicle_id')->references('id')->on('vehicles')->onDelete('set null');
            $table->uuid('customer_id')->nullable();
            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('set null');
            $table->date('start_date');
            $table->integer('start_odometer')->nullable();
            $table->date('end_date')->nullable();
            $table->integer('end_odometer')->nullable();
            $table->enum('status', ['active', 'expired', 'claimed', 'void'])->default('active');
            $table->foreignUuid('resolved_invoice_id')->nullable()->constrained('sales_invoices')->onDelete('set null');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('warranties');
    }
};
