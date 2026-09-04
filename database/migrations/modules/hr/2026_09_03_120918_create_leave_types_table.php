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
        if (!Schema::hasTable('leave_types')) {
            Schema::create('leave_types', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->integer('days_per_year')->default(0);
                $table->boolean('is_short_leave')->default(false);
                $table->enum('short_leave_limit_type', ['month', 'week'])->nullable();
                $table->integer('short_leave_limit')->nullable();
                $table->integer('short_leave_time_minutes')->nullable();
                $table->string('comment')->nullable();
                $table->timestamps();
                $table->softDeletes();
            });
        } else {
            Schema::table('leave_types', function (Blueprint $table) {
                if (!Schema::hasColumn('leave_types', 'is_short_leave')) $table->boolean('is_short_leave')->default(false);
                if (!Schema::hasColumn('leave_types', 'short_leave_limit_type')) $table->enum('short_leave_limit_type', ['month', 'week'])->nullable();
                if (!Schema::hasColumn('leave_types', 'short_leave_limit')) $table->integer('short_leave_limit')->nullable();
                if (!Schema::hasColumn('leave_types', 'short_leave_time_minutes')) $table->integer('short_leave_time_minutes')->nullable();
                if (!Schema::hasColumn('leave_types', 'comment')) $table->string('comment')->nullable();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leave_types');
    }
};
