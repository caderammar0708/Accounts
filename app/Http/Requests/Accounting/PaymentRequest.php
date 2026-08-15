<?php

namespace App\Http\Requests\Accounting;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $chequeMethodId = \App\Models\PaymentMethod::withoutGlobalScopes()
            ->where('name', 'Cheque')
            ->value('id');

        return [
            'exchange_rate' => 'nullable|numeric',
            'currency_id' => 'nullable|string',
            'payee' => 'nullable',
            'account' => 'required',
            'date' => 'required|date',
            'method' => 'nullable',
            'ref' => 'nullable|string',
            'memo' => 'nullable|string',
            'checkDate' => [
                Rule::requiredIf($this->method === $chequeMethodId || $this->paymentMethod === $chequeMethodId),
                'nullable',
                'date',
            ],
            'checkNumber' => [
                Rule::requiredIf($this->method === $chequeMethodId || $this->paymentMethod === $chequeMethodId),
                'nullable',
                'string',
            ],
            'items' => 'nullable|array',
            'itemDetails' => 'nullable|array',
            'paymentAccount' => 'required_without:account',
            'paymentDate' => 'required_without:date|date',
            'paymentMethod' => 'nullable',
        ];
    }

    public function messages(): array
    {
        return [
            'exchange_rate' => 'nullable|numeric',
            'currency_id' => 'nullable|string',
            'checkDate.required' => 'Cheque Date is required when Cheque is selected as the payment method.',
            'checkDate.date' => 'Cheque Date must be a valid date.',
            'checkNumber.required' => 'Cheque Number is required when Cheque is selected as the payment method.',
            'checkNumber.string' => 'Cheque Number must be a valid text value.',
        ];
    }
}
