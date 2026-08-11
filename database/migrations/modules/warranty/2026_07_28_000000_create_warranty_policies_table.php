<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('warranty_policies', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('applies_to', ['service', 'product']);
            $table->integer('duration_days')->nullable();
            $table->integer('duration_km')->nullable();
            $table->enum('expiry_rule', ['whichever_first', 'days_only', 'km_only']);
            $table->text('terms_text')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('warranty_policies');
    }
};
