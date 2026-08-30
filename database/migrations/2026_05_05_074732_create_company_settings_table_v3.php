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
            $table->boolean('branches_enabled')->default(false);
            $table->string('business_type')->default('Normal');
            
            $table->boolean('pos_layout_enabled')->default(false);
            $table->boolean('customer_layout_modal')->default(false);
            $table->boolean('reports_display_as_buttons')->default(true);

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
