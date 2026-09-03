<?php

namespace App\Http\Controllers\Payroll;

use App\Http\Controllers\Controller;
use App\Models\CompanyProfile;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PayrollSettingController extends Controller
{
    /**
     * Display the payroll settings edit form.
     */
    public function edit()
    {
        $setting = CompanyProfile::active();

        return Inertia::render('Admin/PayrollSettingPage', [
            'setting' => $setting,
            'default_template' => CompanyProfile::getDefaultTemplate()
        ]);
    }

    /**
     * Update the payroll settings.
     */
    public function update(Request $request)
    {
        $data = $request->validate([
            'pay_cycle_start_day' => 'required|integer|min:1|max:31',
            'pay_cycle_end_day' => 'required|integer|min:1|max:31',
            'epf_employee_percent' => 'required|numeric|min:0|max:100',
            'epf_employer_percent' => 'required|numeric|min:0|max:100',
            'etf_percent' => 'required|numeric|min:0|max:100',
            'deduct_income_tax' => 'required|boolean',
            'manual_income_tax' => 'required|boolean',
            'apply_ot' => 'required|boolean',
            'payslip_html_template' => 'nullable|string',
            'income_tax_slabs' => 'nullable|array',
            'income_tax_slabs.*.min' => 'required|numeric|min:0',
            'income_tax_slabs.*.max' => 'nullable|numeric|gt:income_tax_slabs.*.min',
            'income_tax_slabs.*.percent' => 'required|numeric|min:0|max:100',
        ]);

        $setting = CompanyProfile::active();
        $setting->fill($data);
        $setting->save();

        return back()->with('success', 'Payroll settings updated successfully.');
    }
}
