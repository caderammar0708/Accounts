<?php

namespace App\Http\Requests\Accounting;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SalesInvoiceRequest extends FormRequest
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
            'customer' => 'nullable',
            'email' => 'nullable|email',
            'vehicle_id' => 'nullable|exists:vehicles,id',
            'receiptDate' => 'required|date',
            'receiptNo' => 'required',
            'paymentMethod' => 'nullable',
            'checkDate' => [
                Rule::requiredIf(!empty($chequeMethodId) && $this->paymentMethod === $chequeMethodId),
                'nullable',
                'date',
            ],
            'checkNumber' => [
                Rule::requiredIf(!empty($chequeMethodId) && $this->paymentMethod === $chequeMethodId),
                'nullable',
                'string',
            ],
            'depositTo' => 'required_unless:action,credit_sale',
            'items' => 'required|array|min:1',
            'items.*.product' => 'required',
            'items.*.amount' => 'required',
            'items.*.warranty' => 'nullable|array',
            'items.*.warranty.policy_id' => 'nullable|exists:warranty_policies,id',
            'items.*.warranty.start_date' => 'nullable|date',
            'action' => 'nullable|string',
            'repairingCost' => 'nullable|numeric',
            'discount_type' => 'nullable|in:percent,fixed',
            'discount_value' => 'nullable|numeric|min:0',
            'prefix' => 'nullable|string',
            'memo_on_statement' => 'nullable|string',
        ];
    }

    public function messages(): array
    {
        return [
            'checkDate.required' => 'Cheque Date is required when Cheque is selected as the payment method.',
            'checkDate.date' => 'Cheque Date must be a valid date.',
            'checkNumber.required' => 'Cheque Number is required when Cheque is selected as the payment method.',
            'checkNumber.string' => 'Cheque Number must be a valid text value.',
        ];
    }
}
