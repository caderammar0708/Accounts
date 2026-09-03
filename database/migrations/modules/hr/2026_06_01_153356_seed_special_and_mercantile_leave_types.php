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
        // 1. Insert Leave Types
        \DB::table('leave_types')->insertOrIgnore([
            [
                'name' => 'Special Leave',
                'code' => 'SL_SPL',
                'days_per_year' => 7,
                'applies_sl_joining_rules' => false,
                'applies_probation_half_rate' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Mercantile Leave',
                'code' => 'SL_MER',
                'days_per_year' => 14,
                'applies_sl_joining_rules' => false,
                'applies_probation_half_rate' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // 2. Populate Balances for Current Year for Existing Active Staff
        $staff = \DB::table('employees')->get();
        $specialLeaveType = \DB::table('leave_types')->where('code', 'SL_SPL')->first();
        $mercantileLeaveType = \DB::table('leave_types')->where('code', 'SL_MER')->first();
        $currentYear = now()->year;

        foreach ($staff as $s) {
            if ($specialLeaveType) {
                \DB::table('leave_balances')->insertOrIgnore([
                    'employee_id' => $s->id,
                    'leave_type_id' => $specialLeaveType->id,
                    'year' => $currentYear,
                    'remaining_days' => 7.00,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
            if ($mercantileLeaveType) {
                \DB::table('leave_balances')->insertOrIgnore([
                    'employee_id' => $s->id,
                    'leave_type_id' => $mercantileLeaveType->id,
                    'year' => $currentYear,
                    'remaining_days' => 14.00,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $specialLeaveType = \DB::table('leave_types')->where('code', 'SL_SPL')->first();
        $mercantileLeaveType = \DB::table('leave_types')->where('code', 'SL_MER')->first();

        if ($specialLeaveType) {
            \DB::table('leave_balances')->where('leave_type_id', $specialLeaveType->id)->delete();
            \DB::table('leave_types')->where('id', $specialLeaveType->id)->delete();
        }
        if ($mercantileLeaveType) {
            \DB::table('leave_balances')->where('leave_type_id', $mercantileLeaveType->id)->delete();
            \DB::table('leave_types')->where('id', $mercantileLeaveType->id)->delete();
        }
    }
};
