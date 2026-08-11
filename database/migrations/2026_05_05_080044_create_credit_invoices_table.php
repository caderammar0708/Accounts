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
        Schema::create('credit_invoices', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('customer_id');
            $table->string('email')->nullable();
            $table->text('billing_address')->nullable();
            $table->text('shipping_address')->nullable();
            $table->string('terms')->nullable();
            $table->date('invoice_date');
            $table->date('due_date')->nullable();
            $table->string('invoice_no');
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->string('discount_type')->default('percent');
            $table->decimal('discount_value', 12, 2)->default(0);
            $table->text('memo')->nullable();
            $table->text('statement_message')->nullable();
            $table->string('prefix')->nullable();
            $table->string('memo_on_statement')->nullable();
            $table->string('status')->default('draft');
            $table->timestamps();

            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('credit_invoices');
    }
};
