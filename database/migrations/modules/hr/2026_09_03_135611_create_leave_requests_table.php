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
        if (!Schema::hasTable('leave_requests')) {
            Schema::create('leave_requests', function (Blueprint $table) {
                $table->id();
                $table->uuid('employee_id');
                $table->unsignedBigInteger('leave_type_id');
                $table->date('start_date');
                $table->date('end_date');
                $table->float('total_days');
                $table->text('reason')->nullable();
                $table->enum('status', ['Pending', 'Approved', 'Rejected'])->default('Pending');
                $table->string('day_type')->default('Full Day');
                $table->string('approved_by')->nullable();
                $table->timestamp('approved_at')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->foreign('employee_id')->references('id')->on('employees')->onDelete('cascade');
                $table->foreign('leave_type_id')->references('id')->on('leave_types')->onDelete('cascade');
            });
        } else {
            Schema::table('leave_requests', function (Blueprint $table) {
                if (!Schema::hasColumn('leave_requests', 'day_type')) $table->string('day_type')->default('Full Day');
                if (!Schema::hasColumn('leave_requests', 'approved_at')) $table->timestamp('approved_at')->nullable();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leave_requests');
    }
};
