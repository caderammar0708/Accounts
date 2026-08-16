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
        Schema::create('bank_import_lines', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('bank_import_id');
            $table->date('transaction_date');
            $table->text('description')->nullable();
            $table->string('reference')->nullable();
            $table->decimal('amount', 15, 2);
            $table->string('status')->default('uncategorized'); // uncategorized, moved, closed
            $table->uuid('assigned_account_id')->nullable();
            $table->uuid('journal_entry_id')->nullable();
            $table->timestamps();

            $table->foreign('bank_import_id')->references('id')->on('bank_imports')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bank_import_lines');
    }
};
