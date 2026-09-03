<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Remove old generic types
        $special = \DB::table('leave_types')->where('code', 'SL_SPL')->first();
        if ($special) {
            \DB::table('leave_balances')->where('leave_type_id', $special->id)->delete();
            \DB::table('leave_requests')->where('leave_type_id', $special->id)->delete();
            \DB::table('leave_types')->where('id', $special->id)->delete();
        }

        $mercantile = \DB::table('leave_types')->where('code', 'SL_MER')->first();
        if ($mercantile) {
            \DB::table('leave_balances')->where('leave_type_id', $mercantile->id)->delete();
            \DB::table('leave_requests')->where('leave_type_id', $mercantile->id)->delete();
            \DB::table('leave_types')->where('id', $mercantile->id)->delete();
        }

        // 2. Insert new Sri Lankan Leave Types
        \DB::table('leave_types')->insertOrIgnore([
            [
                'name' => 'Annual Leave',
                'code' => 'SL_ANN',
                'days_per_year' => 14,
                'applies_sl_joining_rules' => true,
                'applies_probation_half_rate' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Casual Leave',
                'code' => 'SL_CAS',
                'days_per_year' => 7,
                'applies_sl_joining_rules' => false,
                'applies_probation_half_rate' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Maternity Leave',
                'code' => 'SL_MAT',
                'days_per_year' => 84,
                'applies_sl_joining_rules' => false,
                'applies_probation_half_rate' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ]);

        // 3. Populate Balances
        $annual = \DB::table('leave_types')->where('code', 'SL_ANN')->first();
        $casual = \DB::table('leave_types')->where('code', 'SL_CAS')->first();
        $maternity = \DB::table('leave_types')->where('code', 'SL_MAT')->first();
        
        $staff = \DB::table('employees')->get();
        $currentYear = now()->year;

        foreach ($staff as $s) {
            if ($annual) {
                \DB::table('leave_balances')->insertOrIgnore([
                    'employee_id' => $s->id,
                    'leave_type_id' => $annual->id,
                    'year' => $currentYear,
                    'remaining_days' => 14.00,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
            if ($casual) {
                \DB::table('leave_balances')->insertOrIgnore([
                    'employee_id' => $s->id,
                    'leave_type_id' => $casual->id,
                    'year' => $currentYear,
                    'remaining_days' => 7.00,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
            if ($maternity) {
                \DB::table('leave_balances')->insertOrIgnore([
                    'employee_id' => $s->id,
                    'leave_type_id' => $maternity->id,
                    'year' => $currentYear,
                    'remaining_days' => 84.00,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        $annual = \DB::table('leave_types')->where('code', 'SL_ANN')->first();
        $casual = \DB::table('leave_types')->where('code', 'SL_CAS')->first();
        $maternity = \DB::table('leave_types')->where('code', 'SL_MAT')->first();

        if ($annual) {
            \DB::table('leave_balances')->where('leave_type_id', $annual->id)->delete();
            \DB::table('leave_types')->where('id', $annual->id)->delete();
        }
        if ($casual) {
            \DB::table('leave_balances')->where('leave_type_id', $casual->id)->delete();
            \DB::table('leave_types')->where('id', $casual->id)->delete();
        }
        if ($maternity) {
            \DB::table('leave_balances')->where('leave_type_id', $maternity->id)->delete();
            \DB::table('leave_types')->where('id', $maternity->id)->delete();
        }
    }
};
