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
        Schema::create('sales_invoices', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('receipt_no')->nullable();
            $table->uuid('customer_id');
            $table->unsignedBigInteger('vehicle_id')->nullable();
            $table->string('email')->nullable();
            $table->date('receipt_date');
            $table->uuid('payment_method_id')->nullable();
            $table->date('check_date')->nullable();
            $table->string('check_number')->nullable();
            $table->uuid('deposit_to_account_id')->nullable();
            $table->uuid('currency_id')->nullable();
            $table->decimal('exchange_rate', 15, 6)->default(1);
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->string('discount_type')->default('percent');
            $table->decimal('discount_value', 12, 2)->default(0);
            $table->text('memo')->nullable();
            $table->text('statement_message')->nullable();
            $table->string('prefix')->nullable();
            $table->string('memo_on_statement')->nullable();
            $table->foreignUuid('created_by')->constrained('users');
            $table->string('status')->default('draft');
            $table->timestamps();

            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('cascade');
            $table->foreign('payment_method_id')->references('id')->on('payment_methods')->onDelete('set null');
            $table->foreign('deposit_to_account_id')->references('id')->on('chart_of_accs')->onDelete('set null');
        });

        Schema::create('sales_invoice_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('sales_invoice_id')->constrained()->onDelete('cascade');
            $table->uuid('item_id');
            $table->text('description')->nullable();
            $table->decimal('quantity', 15, 4)->default(1);
            $table->decimal('rate', 15, 2)->default(0);
            $table->decimal('amount', 15, 2)->default(0);
            $table->date('service_date')->nullable();
            $table->timestamps();

            $table->foreign('item_id')->references('id')->on('items')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_invoices');
        Schema::dropIfExists('sales_invoice_items');
    }
};
