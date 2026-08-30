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
        Schema::create('bill_payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('supplier_id');
            $table->uuid('currency_id')->nullable();
            $table->decimal('exchange_rate', 15, 6)->nullable();
            $table->decimal('amount', 15, 2)->default(0);
            $table->date('payment_date');
            $table->uuid('payment_method_id')->nullable();
            $table->date('check_date')->nullable();
            $table->string('check_number')->nullable();
            $table->uuid('payment_account_id');
            $table->string('reference_no')->nullable();
            $table->text('memo')->nullable();
            $table->timestamps();

            $table->foreign('supplier_id')->references('id')->on('suppliers')->onDelete('cascade');
            $table->foreign('payment_account_id')->references('id')->on('chart_of_accs')->onDelete('cascade');
        });

        Schema::create('bill_payment_allocations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('bill_payment_id');
            $table->uuid('bill_id');
            $table->decimal('amount_applied', 15, 2);
            $table->timestamps();

            $table->foreign('bill_payment_id')->references('id')->on('bill_payments')->onDelete('cascade');
            $table->foreign('bill_id')->references('id')->on('bills')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bill_payments');
        Schema::dropIfExists('bill_payment_allocations');
    }
};
