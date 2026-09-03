<?php

namespace App\Http\Requests\Payroll;

use Illuminate\Foundation\Http\FormRequest;

class LeaveTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('leave_type')?->id ?? null;

        return [
            'name'          => 'required|string|max:255',
            'days_per_year' => 'required|integer|min:0',
            'code'          => 'nullable|string|max:50|unique:leave_types,code,' . $id,
            'applies_sl_joining_rules' => 'nullable|boolean',
            'applies_probation_half_rate' => 'nullable|boolean',
            'comment' => 'nullable|string',
            'is_short_leave' => 'nullable|boolean',
            'short_leave_limit_type' => 'nullable|in:month,week',
            'short_leave_limit' => 'nullable|integer|min:0',
            'short_leave_time_minutes' => 'nullable|integer|min:0',
        ];
    }
}
