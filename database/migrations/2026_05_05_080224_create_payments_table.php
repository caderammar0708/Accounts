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
        Schema::create('payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('payee_id')->nullable();
            $table->string('payee_type')->nullable(); // Customer, Supplier, or Employee
            $table->uuid('payment_account_id');
            $table->date('payment_date');
            $table->uuid('payment_method_id')->nullable();
            $table->date('check_date')->nullable();
            $table->string('check_number')->nullable();
            $table->string('reference_no')->nullable();
            $table->uuid('currency_id')->nullable();
            $table->decimal('exchange_rate', 15, 6)->nullable();
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->text('memo')->nullable();
            $table->string('status')->default('posted');
            $table->timestamps();

            $table->foreign('payment_account_id')->references('id')->on('chart_of_accs')->onDelete('cascade');
        });

        Schema::create('payment_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('payment_id')->constrained()->onDelete('cascade');
            $table->uuid('item_id')->nullable();
            $table->uuid('chart_of_acc_id');
            $table->text('description')->nullable();
            $table->decimal('quantity', 15, 2)->default(1);
            $table->decimal('rate', 15, 2)->default(0);
            $table->decimal('amount', 15, 2)->default(0);
            $table->timestamps();

            $table->foreign('chart_of_acc_id')->references('id')->on('chart_of_accs')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
        Schema::dropIfExists('payment_items');
    }
};
