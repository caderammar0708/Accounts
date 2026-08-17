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
        Schema::create('exchange_rates', function (Blueprint $table) {
            $table->id();
            $table->string('base_currency', 10);
            $table->string('quote_currency', 10);
            $table->date('date');
            $table->decimal('rate', 15, 6);
            $table->string('provider')->default('Frankfurter');
            $table->timestamps();

            $table->unique(['base_currency', 'quote_currency', 'date', 'provider'], 'exchange_rate_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exchange_rates');
    }
};
