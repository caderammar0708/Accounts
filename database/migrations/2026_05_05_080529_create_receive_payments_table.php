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
        Schema::create('cheque_deposits', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('deposit_no')->nullable();
            $table->date('deposit_date');
            $table->uuid('deposit_to_account_id')->nullable();
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->text('memo')->nullable();
            $table->string('status')->default('draft');
            $table->timestamps();

            $table->foreign('deposit_to_account_id')->references('id')->on('chart_of_accs')->onDelete('set null');
        });

        Schema::create('receive_payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('customer_id');
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

        Schema::create('cheque_deposit_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('cheque_deposit_id');
            $table->uuid('receive_payment_id');
            $table->decimal('amount', 15, 2)->default(0);
            $table->timestamps();

            $table->foreign('cheque_deposit_id')->references('id')->on('cheque_deposits')->onDelete('cascade');
            $table->foreign('receive_payment_id')->references('id')->on('receive_payments')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cheque_deposit_items');
        Schema::dropIfExists('receive_payments');
        Schema::dropIfExists('cheque_deposits');
    }
};
