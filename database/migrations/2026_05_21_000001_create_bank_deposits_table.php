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
        Schema::create('bank_deposits', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('deposit_no')->nullable();
            $table->date('deposit_date');
            $table->uuid('deposit_to_account_id')->nullable();
            $table->uuid('cash_back_account_id')->nullable();
            $table->text('cash_back_memo')->nullable();
            $table->decimal('cash_back_amount', 15, 2)->default(0);
            $table->uuid('currency_id')->nullable();
            $table->decimal('exchange_rate', 15, 6)->nullable();
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->text('memo')->nullable();
            $table->string('status')->default('draft');
            $table->timestamps();

            $table->foreign('deposit_to_account_id')->references('id')->on('chart_of_accs')->onDelete('set null');
            $table->foreign('cash_back_account_id')->references('id')->on('chart_of_accs')->onDelete('set null');
        });

        Schema::create('bank_deposit_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('bank_deposit_id');
            $table->string('received_from')->nullable();
            $table->uuid('account_id')->nullable();
            $table->text('description')->nullable();
            $table->uuid('payment_method_id')->nullable();
            $table->string('ref_no')->nullable();
            $table->decimal('amount', 15, 2)->default(0);
            $table->timestamps();

            $table->foreign('bank_deposit_id')->references('id')->on('bank_deposits')->onDelete('cascade');
            $table->foreign('account_id')->references('id')->on('chart_of_accs')->onDelete('set null');
            $table->foreign('payment_method_id')->references('id')->on('payment_methods')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bank_deposits');
        Schema::dropIfExists('bank_deposit_items');
    }
};
