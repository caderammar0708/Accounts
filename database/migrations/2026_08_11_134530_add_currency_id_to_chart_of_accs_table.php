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
        Schema::table('chart_of_accs', function (Blueprint $table) {
            $table->uuid('currency_id')->nullable()->after('sub_type');
            $table->foreign('currency_id')->references('id')->on('currencies')->onDelete('set null');
            $table->dropColumn('currency');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('chart_of_accs', function (Blueprint $table) {
            $table->string('currency', 3)->nullable()->after('sub_type');
            $table->dropForeign(['currency_id']);
            $table->dropColumn('currency_id');
        });
    }
};
