<?php

namespace App\Http\Requests\Payroll;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AttendanceRequest extends FormRequest
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
            'date'      => 'required|date',
            'check_in'  => 'nullable|date_format:H:i',
            'lunch_out' => 'nullable|date_format:H:i',
            'lunch_in'  => 'nullable|date_format:H:i',
            'outside_out' => 'nullable|date_format:H:i',
            'outside_in'  => 'nullable|date_format:H:i',
            'outside_reason' => 'nullable|string|max:1000',
            'check_out' => 'nullable|date_format:H:i',
            'status'    => 'required|in:Present,Late,Early Leave,Absent',
            'admin_note' => 'nullable|string|max:1000',
        ];
    }
}
