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
        Schema::create('transfers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('from_account_id');
            $table->uuid('to_account_id');
            $table->uuid('currency_id')->nullable();
            $table->decimal('exchange_rate', 15, 6)->nullable();
            $table->decimal('amount', 15, 2)->default(0);
            $table->date('date');
            $table->text('memo')->nullable();
            $table->string('reference_no')->nullable();
            $table->timestamps();

            $table->foreign('from_account_id')->references('id')->on('chart_of_accs')->onDelete('cascade');
            $table->foreign('to_account_id')->references('id')->on('chart_of_accs')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transfers');
    }
};
