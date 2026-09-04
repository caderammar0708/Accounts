import React, { useState } from 'react';
import { useForm, usePage, Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CommonButton from '@/Components/CommonButton';
import CurrencyInput from '@/Components/CurrencyInput';
import EmployeeTabs from '@/Components/EmployeeTabs';

const StaffSalaryPage = ({ auth }) => {
    const { employee, settings, company } = usePage().props;
    const prefix = company?.currency_prefix || 'LKR';

    const salaryStructure = employee.salary_structure || {};
    const [allowances, setAllowances] = useState(salaryStructure.allowances || []);
    const [deductions, setDeductions] = useState(salaryStructure.deductions || []);

    const { data, setData, put, processing, errors, isDirty } = useForm({
        basic_salary: salaryStructure.basic_salary ?? employee.salary ?? 0,
        ot_rate_per_hour: salaryStructure.ot_rate_per_hour ?? 0,
        bonus: salaryStructure.bonus ?? 0,
        loan_deduction: salaryStructure.loan_deduction ?? 0,
        leave_deduction: salaryStructure.leave_deduction ?? 0,
        income_tax: salaryStructure.income_tax ?? 0,
        allowances: allowances,
        deductions: deductions,
        deduct_epf: salaryStructure.deduct_epf ?? true,
        deduct_etf: salaryStructure.deduct_etf ?? true,
        deduct_tax: salaryStructure.deduct_tax ?? true,
    });

    const addAllowance = () => {
        const updated = [...allowances, { label: '', amount: 0 }];
        setAllowances(updated);
        setData('allowances', updated);
    };

    const addDeduction = () => {
        const updated = [...deductions, { label: '', amount: 0 }];
        setDeductions(updated);
        setData('deductions', updated);
    };

    const removeAllowance = (index) => {
        const updated = allowances.filter((_, idx) => idx !== index);
        setAllowances(updated);
        setData('allowances', updated);
    };

    const removeDeduction = (index) => {
        const updated = deductions.filter((_, idx) => idx !== index);
        setDeductions(updated);
        setData('deductions', updated);
    };

    const updateAllowance = (index, key, val) => {
        const updated = [...allowances];
        updated[index][key] = val;
        setAllowances(updated);
        setData('allowances', updated);
    };

    const updateDeduction = (index, key, val) => {
        const updated = [...deductions];
        updated[index][key] = val;
        setDeductions(updated);
        setData('deductions', updated);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('employees.salary.update', employee.id), {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout
            user={auth?.user || {}}
            header={<h2 className="font-bold text-lg text-slate-800 tracking-tight">Edit Employee</h2>}
        >
            <Head title={`Edit Salary - ${employee.name}`} />

            <div className="p-6 max-w-7xl mx-auto space-y-6">
                <div>
                    <div className="mb-3">
                        <Link 
                            href={route('employees.index')} 
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-primary transition-colors uppercase tracking-wider"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Employees
                        </Link>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Edit Employee: {employee.name}</h1>
                            <p className="text-xs text-slate-500 mt-0.5">Configure base remuneration, statutory deductions, and dynamic allowances.</p>
                        </div>
                    </div>
                </div>

                <EmployeeTabs employeeId={employee.id} activeTab="salary" isDirty={isDirty} />

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Base Salary Settings Card */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-sm font-bold text-slate-800 tracking-tight">Base Remuneration & Overtime</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Configure primary base salary and hourly overtime calculation rate.</p>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <CurrencyInput
                                label="Basic Salary"
                                prefix={prefix}
                                value={data.basic_salary}
                                onChange={(val) => setData('basic_salary', parseFloat(val) || 0)}
                                error={errors.basic_salary}
                                required
                            />
                            <CurrencyInput
                                label="OT Rate Per Hour"
                                prefix={prefix}
                                value={data.ot_rate_per_hour}
                                onChange={(val) => setData('ot_rate_per_hour', parseFloat(val) || 0)}
                                error={errors.ot_rate_per_hour}
                            />
                            {settings?.payroll?.deduct_income_tax && settings?.payroll?.manual_income_tax && (
                                <div className="col-span-1 md:col-span-2">
                                    <CurrencyInput
                                        label="Income Tax Override (Monthly)"
                                        prefix={prefix}
                                        value={data.income_tax}
                                        onChange={(val) => setData('income_tax', parseFloat(val) || 0)}
                                        error={errors.income_tax}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Statutory Deductions Card */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-sm font-bold text-slate-800 tracking-tight">Statutory Deductions & Taxes</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Toggle statutory compliance contributions (EPF, ETF) and income tax for this employee.</p>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="flex items-center justify-between p-4 bg-slate-50/60 rounded-lg border border-slate-100">
                                <div>
                                    <label htmlFor="deduct_epf" className="text-xs font-bold text-slate-800 cursor-pointer block">
                                        Deduct EPF Contribution
                                    </label>
                                    <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                                        Employee ({company?.epf_employee_percent || 8}%) & Employer ({company?.epf_employer_percent || 12}%)
                                    </span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer scale-90 shrink-0 ml-4">
                                    <input
                                        type="checkbox"
                                        id="deduct_epf"
                                        checked={data.deduct_epf}
                                        onChange={(e) => setData('deduct_epf', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-50/60 rounded-lg border border-slate-100">
                                <div>
                                    <label htmlFor="deduct_etf" className="text-xs font-bold text-slate-800 cursor-pointer block">
                                        Deduct ETF Contribution
                                    </label>
                                    <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                                        Employer ETF ({company?.etf_percent || 3}%)
                                    </span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer scale-90 shrink-0 ml-4">
                                    <input
                                        type="checkbox"
                                        id="deduct_etf"
                                        checked={data.deduct_etf}
                                        onChange={(e) => setData('deduct_etf', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-50/60 rounded-lg border border-slate-100">
                                <div>
                                    <label htmlFor="deduct_tax" className="text-xs font-bold text-slate-800 cursor-pointer block">
                                        Deduct Income Tax (PAYE)
                                    </label>
                                    <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                                        Statutory income tax withholding
                                    </span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer scale-90 shrink-0 ml-4">
                                    <input
                                        type="checkbox"
                                        id="deduct_tax"
                                        checked={data.deduct_tax}
                                        onChange={(e) => setData('deduct_tax', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Recurring Adjustments Card */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-sm font-bold text-slate-800 tracking-tight">Recurring Adjustments & Deductions</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Standard monthly bonus, regular loan deductions, and standard leave penalty amounts.</p>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <CurrencyInput
                                label="Regular Bonus"
                                prefix={prefix}
                                value={data.bonus}
                                onChange={(val) => setData('bonus', parseFloat(val) || 0)}
                                error={errors.bonus}
                            />
                            <CurrencyInput
                                label="Loan Deduction"
                                prefix={prefix}
                                value={data.loan_deduction}
                                onChange={(val) => setData('loan_deduction', parseFloat(val) || 0)}
                                error={errors.loan_deduction}
                            />
                            <CurrencyInput
                                label="Leave Deduction"
                                prefix={prefix}
                                value={data.leave_deduction}
                                onChange={(val) => setData('leave_deduction', parseFloat(val) || 0)}
                                error={errors.leave_deduction}
                            />
                        </div>
                    </div>

                    {/* Dynamic Allowances & Deductions Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Dynamic Allowances */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-800 tracking-tight">Dynamic Allowances</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Custom earnings categories (e.g. Travel, Attendance).</p>
                                </div>
                                <CommonButton 
                                    type="button" 
                                    variant="secondary" 
                                    size="xs"
                                    onClick={addAllowance}
                                >
                                    + Add Item
                                </CommonButton>
                            </div>
                            <div className="p-6 space-y-3 flex-1">
                                {allowances.map((item, idx) => (
                                    <div key={idx} className="flex gap-2 items-center bg-slate-50/60 p-2 rounded-lg border border-slate-200/60">
                                        <input 
                                            placeholder="Allowance Name (e.g. Travel)" 
                                            value={item.label} 
                                            onChange={(e) => updateAllowance(idx, 'label', e.target.value)} 
                                            className="flex-1 text-xs border border-slate-300 rounded px-2.5 py-1.5 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 text-slate-800" 
                                        />
                                        <div className="w-40">
                                            <CurrencyInput
                                                prefix={prefix}
                                                size="sm"
                                                value={item.amount}
                                                onChange={(val) => updateAllowance(idx, 'amount', parseFloat(val) || 0)}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeAllowance(idx)}
                                            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition"
                                            title="Remove Item"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                                {allowances.length === 0 && (
                                    <div className="text-center py-6 text-xs text-slate-400 font-medium italic">
                                        No custom allowances assigned. Use "+ Add Item" to configure one.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Dynamic Deductions */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-800 tracking-tight">Custom Deductions</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Recurring penalties, welfare, or payback deductions.</p>
                                </div>
                                <CommonButton 
                                    type="button" 
                                    variant="secondary" 
                                    size="xs"
                                    onClick={addDeduction}
                                >
                                    + Add Item
                                </CommonButton>
                            </div>
                            <div className="p-6 space-y-3 flex-1">
                                {deductions.map((item, idx) => (
                                    <div key={idx} className="flex gap-2 items-center bg-slate-50/60 p-2 rounded-lg border border-slate-200/60">
                                        <input 
                                            placeholder="Deduction Name (e.g. Welfare)" 
                                            value={item.label} 
                                            onChange={(e) => updateDeduction(idx, 'label', e.target.value)} 
                                            className="flex-1 text-xs border border-slate-300 rounded px-2.5 py-1.5 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 text-slate-800" 
                                        />
                                        <div className="w-40">
                                            <CurrencyInput
                                                prefix={prefix}
                                                size="sm"
                                                value={item.amount}
                                                onChange={(val) => updateDeduction(idx, 'amount', parseFloat(val) || 0)}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeDeduction(idx)}
                                            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition"
                                            title="Remove Item"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                                {deductions.length === 0 && (
                                    <div className="text-center py-6 text-xs text-slate-400 font-medium italic">
                                        No custom deductions assigned. Use "+ Add Item" to configure one.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Actions Bar */}
                    <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
                        <CommonButton 
                            variant="secondary" 
                            href={route('employees.index')}
                        >
                            Cancel
                        </CommonButton>
                        <CommonButton
                            type="submit"
                            variant="primary"
                            processing={processing}
                        >
                            {processing ? 'Saving...' : 'Update Salary Structure'}
                        </CommonButton>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
};

export default StaffSalaryPage;
