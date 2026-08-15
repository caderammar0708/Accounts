<?php

namespace App\Http\Requests\Accounting;

use Illuminate\Foundation\Http\FormRequest;

class BankDepositRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'exchange_rate' => 'nullable|numeric',
            'currency_id' => 'nullable|string',
            'depositDate' => 'required|date',
            'depositNo' => 'required',
            'depositTo' => 'required',
            'cashBackAccount' => 'nullable|uuid',
            'cashBackMemo' => 'nullable|string',
            'cashBackAmount' => 'nullable|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.amount' => 'required',
        ];
    }
}
