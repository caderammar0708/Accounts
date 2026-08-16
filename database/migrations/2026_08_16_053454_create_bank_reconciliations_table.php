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
        Schema::create('bank_reconciliations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('company_id')->nullable();
            $table->uuid('account_id');
            $table->date('start_date');
            $table->date('end_date');
            $table->decimal('opening_balance', 15, 2)->default(0);
            $table->decimal('ending_balance', 15, 2)->default(0);
            $table->decimal('cleared_balance', 15, 2)->default(0);
            $table->string('status')->default('draft'); // draft, completed
            
            $table->uuid('created_by')->nullable();
            $table->timestamps();

            $table->foreign('account_id')->references('id')->on('chart_of_accs')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bank_reconciliations');
    }
};
