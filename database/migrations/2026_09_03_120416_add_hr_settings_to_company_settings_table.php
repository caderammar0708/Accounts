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
        Schema::table('company_settings', function (Blueprint $table) {
            // Remote Check-in
            $table->boolean('remote_checkin_auto_approve')->default(false);
            $table->boolean('prayer_break_auto_approve')->default(false);

            // Leave Mails
            $table->string('receiver_email')->nullable();
            $table->string('cc_emails')->nullable();
            $table->string('bcc_emails')->nullable();

            // Payroll Settings
            $table->decimal('basic_salary_percentage', 5, 2)->default(0);
            $table->decimal('allowance_percentage', 5, 2)->default(0);
            $table->decimal('epf_employee_percentage', 5, 2)->default(0);
            $table->decimal('epf_employer_percentage', 5, 2)->default(0);
            $table->decimal('etf_employer_percentage', 5, 2)->default(0);

            // QR Settings
            $table->enum('qr_type', ['Static', 'Dynamic'])->default('Static');
            $table->integer('qr_dynamic_interval')->nullable(); // In minutes
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('company_settings', function (Blueprint $table) {
            $table->dropColumn([
                'remote_checkin_auto_approve',
                'prayer_break_auto_approve',
                'receiver_email',
                'cc_emails',
                'bcc_emails',
                'basic_salary_percentage',
                'allowance_percentage',
                'epf_employee_percentage',
                'epf_employer_percentage',
                'etf_employer_percentage',
                'qr_type',
                'qr_dynamic_interval',
            ]);
        });
    }
};
