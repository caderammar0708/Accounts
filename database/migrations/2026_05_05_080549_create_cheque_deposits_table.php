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
        Schema::dropIfExists('cheque_deposits');
        Schema::dropIfExists('cheque_deposit_items');
    }
};
