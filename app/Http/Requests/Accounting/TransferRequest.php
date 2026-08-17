<?php

namespace App\Http\Requests\Accounting;

use Illuminate\Foundation\Http\FormRequest;

class TransferRequest extends FormRequest
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
            'transfer_from' => 'required|uuid|exists:chart_of_accs,id',
            'transfer_to'   => 'required|uuid|exists:chart_of_accs,id|different:transfer_from',
            'amount'        => 'required|numeric|min:0.01',
            'date'          => 'required|date',
            'memo'          => 'nullable|string',
        ];
    }
}
