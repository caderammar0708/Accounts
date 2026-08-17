<?php

namespace App\Http\Requests\Accounting;

use Illuminate\Foundation\Http\FormRequest;

class JournalEntryRequest extends FormRequest
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
            'date' => 'required|date',
            'lines' => 'required|array|min:2',
            'lines.*.account_id' => 'required|exists:chart_of_accs,id',
            'lines.*.debit' => 'nullable|numeric',
            'lines.*.credit' => 'nullable|numeric',
            'lines.*.fc_currency_id' => 'nullable|string',
            'lines.*.fc_debit' => 'nullable|numeric',
            'lines.*.fc_credit' => 'nullable|numeric',
            'lines.*.exchange_rate' => 'nullable|numeric',
        ];
    }
}
