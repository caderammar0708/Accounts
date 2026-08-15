<?php

namespace App\Http\Requests\Accounting;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Models\PaymentMethod;

class ReceivePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $chequeMethodId = PaymentMethod::withoutGlobalScopes()
            ->where('name', 'Cheque')
            ->value('id');

        return [
            'exchange_rate' => 'nullable|numeric',
            'currency_id' => 'nullable|string',
            'customer' => 'required',
            'amountReceived' => 'required',
            'paymentDate' => 'required|date',
            'depositTo' => 'required',
            'paymentMethod' => 'required',
            'checkDate' => [
                Rule::requiredIf($this->paymentMethod === $chequeMethodId),
                'nullable',
                'date',
            ],
            'checkNumber' => [
                Rule::requiredIf($this->paymentMethod === $chequeMethodId),
                'nullable',
                'string',
            ],
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
