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
            $table->uuid('deposit_to_account_id')->nullable();
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->text('memo')->nullable();
            $table->text('statement_message')->nullable();
            $table->string('status')->default('draft');
            $table->timestamps();

            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('cascade');
            $table->foreign('payment_method_id')->references('id')->on('payment_methods')->onDelete('set null');
            $table->foreign('deposit_to_account_id')->references('id')->on('chart_of_accs')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_invoices');
    }
};
