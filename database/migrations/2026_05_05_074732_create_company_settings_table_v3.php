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
        Schema::create('company_settings', function (Blueprint $table) {
            $table->id();
            // Payment Settings
            $table->text('low_stock_to_emails')->nullable();
            $table->text('low_stock_cc_emails')->nullable();
            $table->text('low_stock_bcc_emails')->nullable();

            $table->string('acct_method', 50)->default('Accrual');
            $table->string('fin_year_start', 20)->default('January');
            $table->string('tax_year_start', 50)->default('Same as financial year');
            $table->date('books_lock_date')->nullable();
            $table->string('books_lock_pin')->nullable();
            $table->string('tax_form', 100)->default('Partnership or limited liability company');
            $table->boolean('multi_currency_enabled')->default(false);
            $table->uuid('home_currency_id')->nullable();
            
            $table->boolean('pos_layout_enabled')->default(false);
            $table->boolean('warranty_layout_enabled')->default(false);
            $table->boolean('job_layout_enabled')->default(false);
            $table->boolean('customer_layout_modal')->default(false);
            $table->boolean('reports_display_as_buttons')->default(true);
            $table->boolean('vehicles_enabled')->default(false);
            
            $table->foreign('home_currency_id')->references('id')->on('currencies')->onDelete('set null');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('company_settings');
    }
};
