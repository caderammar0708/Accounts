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
        Schema::create('receive_payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('customer_id');
            $table->uuid('currency_id')->nullable();
            $table->decimal('exchange_rate', 15, 6)->nullable();
            $table->decimal('amount', 15, 2)->default(0);
            $table->date('payment_date');
            $table->uuid('payment_method_id')->nullable();
            $table->date('check_date')->nullable();
            $table->string('check_number')->nullable();
            $table->uuid('deposit_to_account_id');
            $table->string('reference_no')->nullable();
            $table->text('memo')->nullable();
            $table->uuid('cheque_deposit_id')->nullable();
            $table->timestamps();

            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('cascade');
            $table->foreign('deposit_to_account_id')->references('id')->on('chart_of_accs')->onDelete('cascade');
            $table->foreign('cheque_deposit_id')->references('id')->on('cheque_deposits')->onDelete('set null');
        });

        Schema::create('receive_payment_allocations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('receive_payment_id')->constrained()->onDelete('cascade');
            $table->uuid('credit_invoice_id');
            $table->decimal('amount', 15, 2)->default(0);
            $table->timestamps();

            $table->foreign('credit_invoice_id')->references('id')->on('credit_invoices')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cheque_deposits');
        Schema::dropIfExists('cheque_deposit_items');
        Schema::dropIfExists('receive_payments');
        Schema::dropIfExists('receive_payment_allocations');
    }
};
