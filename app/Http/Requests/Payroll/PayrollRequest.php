<?php

namespace App\Http\Requests\Payroll;

use Illuminate\Foundation\Http\FormRequest;

class PayrollRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'month' => 'required|integer|between:1,12',
            'year'  => [
                'required',
                'integer',
                'min:2020',
                function ($attribute, $value, $fail) {
                    $exists = \App\Models\HR\Payroll::where('month', $this->input('month'))
                        ->where('year', $value)
                        ->exists();
                    if ($exists) {
                        $fail('A payroll for this period (month and year) has already been generated.');
                    }
                }
            ],
            'comment' => 'nullable|string',
        ];
    }
}
