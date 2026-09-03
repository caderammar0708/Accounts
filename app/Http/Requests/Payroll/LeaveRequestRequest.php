<?php

namespace App\Http\Requests\Payroll;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LeaveRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'employee_id' => [
                'required',
                Rule::exists('employees', 'id')->whereNull('deleted_at'),
            ],
            'leave_type_id' => [
                'required',
                Rule::exists('leave_types', 'id')->whereNull('deleted_at'),
            ],
            'start_date' => 'required|date',
            'end_date'   => 'required|date|after_or_equal:start_date',
            'day_type'   => 'nullable|string|in:Full Day,Half Day,Short Leave',
            'start_time' => 'nullable|date_format:H:i',
            'end_time'   => 'nullable|date_format:H:i',
            'reason'     => 'nullable|string|max:1000',
            'cc'         => 'nullable|string',
            'bcc'        => 'nullable|string',
        ];
    }
}
