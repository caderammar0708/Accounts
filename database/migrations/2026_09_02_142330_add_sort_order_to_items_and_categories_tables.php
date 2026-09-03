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
        Schema::table('item_categories', function (Blueprint $table) {
            $table->integer('sort_order')->default(0)->after('parent_id');
        });

        Schema::table('items', function (Blueprint $table) {
            $table->integer('sort_order')->default(0)->after('item_category_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->dropColumn('sort_order');
        });

        Schema::table('item_categories', function (Blueprint $table) {
            $table->dropColumn('sort_order');
        });
    }
};
