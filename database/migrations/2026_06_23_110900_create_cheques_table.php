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
        Schema::create('cheques', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('payee_id')->nullable();
            $table->string('payee_type')->nullable(); // Customer or Supplier
            $table->uuid('bank_account_id');
            $table->date('payment_date');
            $table->string('cheque_no')->nullable();
            $table->foreignUuid('currency_id')->nullable()->constrained('currencies')->nullOnDelete();
            $table->decimal('exchange_rate', 15, 6)->default(1.000000);
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->text('mailing_address')->nullable();
            $table->text('memo')->nullable();
            $table->string('status')->default('posted');
            $table->timestamps();
            $table->softDeletes();
            
            $table->foreign('bank_account_id')->references('id')->on('chart_of_accs')->onDelete('cascade');
        });

        Schema::create('cheque_lines', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('cheque_id');
            $table->uuid('category_account_id')->nullable();
            $table->string('description')->nullable();
            $table->decimal('amount', 15, 2)->default(0);
            $table->uuid('customer_id')->nullable();
            $table->integer('line_order')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('cheque_id')->references('id')->on('cheques')->onDelete('cascade');
            $table->foreign('category_account_id')->references('id')->on('chart_of_accs')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cheques');
        Schema::dropIfExists('cheque_lines');
    }
};
