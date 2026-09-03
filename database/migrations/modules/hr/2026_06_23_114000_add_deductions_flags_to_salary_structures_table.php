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
        Schema::table('salary_structures', function (Blueprint $table) {
            $table->boolean('deduct_epf')->default(true)->after('income_tax');
            $table->boolean('deduct_etf')->default(true)->after('deduct_epf');
            $table->boolean('deduct_tax')->default(true)->after('deduct_etf');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('salary_structures', function (Blueprint $table) {
            $table->dropColumn(['deduct_epf', 'deduct_etf', 'deduct_tax']);
        });
    }
};
