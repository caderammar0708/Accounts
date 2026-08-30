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
        Schema::create('journal_entries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->date('date');
            $table->date('due_date')->nullable();
            $table->string('reference')->nullable();
            $table->text('description')->nullable();
            
            // Payee & Payment Method
            $table->uuid('payee_id')->nullable();
            $table->string('payee_type')->nullable();
            $table->uuid('payment_method_id')->nullable();

            $table->string('transaction_type')->nullable();
            $table->nullableUuidMorphs('transactionable');
            $table->uuid('currency_id')->nullable();
            $table->decimal('exchange_rate', 15, 6)->nullable();
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->string('status')->default('draft');
            $table->foreignUuid('created_by')->constrained('users');
            $table->timestamps();
        });

        Schema::create('journal_entry_lines', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('journal_entry_id')->constrained()->onDelete('cascade');
            $table->foreignUuid('chart_of_acc_id')->constrained();
            
            // Per-line Payee
            $table->uuid('payee_id')->nullable();
            $table->string('payee_type')->nullable();

            $table->uuid('fc_currency_id')->nullable();
            $table->decimal('exchange_rate', 15, 6)->nullable();
            $table->decimal('fc_debit', 15, 2)->nullable();
            $table->decimal('fc_credit', 15, 2)->nullable();
            
            $table->decimal('debit', 15, 2)->default(0);
            $table->decimal('credit', 15, 2)->default(0);
            $table->boolean('is_cleared')->default(false);
            $table->uuid('bank_reconciliation_id')->nullable();
            $table->text('memo')->nullable();
            $table->date('service_date')->nullable();
            $table->timestamps();
            
            $table->foreign('fc_currency_id')->references('id')->on('currencies')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('journal_entry_lines');
        Schema::dropIfExists('journal_entries');
    }
};
