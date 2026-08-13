<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('warranty_claims', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('warranty_id')->constrained('warranties')->onDelete('cascade');
            $table->date('claim_date');
            $table->integer('odometer_at_claim')->nullable();
            $table->text('issue_description');
            $table->text('resolution')->nullable();
            $table->foreignUuid('resolved_invoice_id')->nullable()->constrained('sales_invoices')->onDelete('set null');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('warranty_claims');
    }
};
