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
        Schema::table('employees', function (Blueprint $table) {
            if (!Schema::hasColumn('employees', 'calling_name')) $table->string('calling_name')->nullable();
            if (!Schema::hasColumn('employees', 'nic')) $table->string('nic')->nullable();
            if (!Schema::hasColumn('employees', 'dob')) $table->date('dob')->nullable();
            
            if (!Schema::hasColumn('employees', 'shift_id')) $table->foreignId('shift_id')->nullable()->constrained('shifts')->nullOnDelete();
            
            if (!Schema::hasColumn('employees', 'photo')) $table->string('photo')->nullable();
            if (!Schema::hasColumn('employees', 'cv_path')) $table->string('cv_path')->nullable();
            if (!Schema::hasColumn('employees', 'id_copy_path')) $table->string('id_copy_path')->nullable();
            if (!Schema::hasColumn('employees', 'certificate_path')) $table->string('certificate_path')->nullable();
            
            if (!Schema::hasColumn('employees', 'left_date')) $table->date('left_date')->nullable();
            
            if (!Schema::hasColumn('employees', 'is_field_staff')) $table->boolean('is_field_staff')->default(false);
            if (!Schema::hasColumn('employees', 'is_manager')) $table->boolean('is_manager')->default(false);
            if (!Schema::hasColumn('employees', 'is_auto_attendance')) $table->boolean('is_auto_attendance')->default(false);
            
            if (!Schema::hasColumn('employees', 'probation_duration_months')) $table->integer('probation_duration_months')->nullable();
            if (!Schema::hasColumn('employees', 'probation_status')) $table->string('probation_status')->default('probation');
            if (!Schema::hasColumn('employees', 'probation_confirmed_date')) $table->date('probation_confirmed_date')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropForeign(['shift_id']);
            $table->dropColumn([
                'calling_name',
                'nic',
                'dob',
                'shift_id',
                'photo',
                'cv_path',
                'id_copy_path',
                'certificate_path',
                'left_date',
                'is_field_staff',
                'is_manager',
                'is_auto_attendance',
                'probation_duration_months',
                'probation_status',
                'probation_confirmed_date'
            ]);
        });
    }
};
