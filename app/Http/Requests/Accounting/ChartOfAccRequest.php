<?php

namespace App\Http\Requests\Accounting;

use App\Models\Accounting\ChartOfAcc;
use App\Models\Company;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ChartOfAccRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation()
    {
        if ($this->has('opening_balance')) {
            $this->merge([
                'opening_balance' => str_replace(',', '', $this->input('opening_balance'))
            ]);
        }
    }

    public function rules(): array
    {
        $chartOfAccount = $this->route('chart_of_account');
        $chartOfAccountId = $chartOfAccount ? $chartOfAccount->id : null;

        return [
            'account_code' => [
                'required',
                'string',
                'max:255',
                Rule::unique('chart_of_accs', 'account_code')
                    ->ignore($chartOfAccountId)
                    ->where(function ($query) {
                        return $query;
                    })
            ],
            'name' => [
                'required',
                'string',
                'max:255',
                function ($attribute, $value, $fail) use ($chartOfAccountId) {
                    $query = ChartOfAcc::query()->whereRaw('LOWER(name) = ?', [Str::lower($value)]);
                    if ($chartOfAccountId) {
                        $query->where('id', '!=', $chartOfAccountId);
                    }
                    if ($query->exists()) {
                        $fail('An account with this name already exists.');
                    }
                },
            ],
            'account_type' => 'required|in:asset,liability,equity,income,expense',
            'sub_type' => 'nullable|string|max:255',
            'opening_balance' => 'nullable|numeric',
            'opening_balance_date' => 'nullable|date',
            'description' => 'nullable|string',
            'is_active' => 'sometimes|boolean',
            'currency' => 'nullable|string|max:10',
            'parent_id' => 'nullable|uuid|exists:chart_of_accs,id',
            'is_locked' => 'nullable|boolean',
            'location_id' => 'nullable|exists:locations,id',
        ];
    }
}
