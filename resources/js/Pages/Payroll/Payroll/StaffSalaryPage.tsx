import React, { useState } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import { usePageHeader } from '@/src/App';
import { Staff, PageProps } from '@/src/types';
import { InputField } from '@/src/components/ui/InputFeild';

import { TrashIcon } from '@/src/components/icons/Icons';
import Button from '@/src/components/ui/Button';
import StaffTabs from '@/src/components/ui/StaffTabs';

const StaffSalaryPage: React.FC = () => {
    const { staff, settings, company } = usePage<Page<PageProps>>().props as any;
    const { setTitle } = usePageHeader();

    const [allowances, setAllowances] = useState(staff.salary_structure?.allowances || []);
    const [deductions, setDeductions] = useState(staff.salary_structure?.deductions || []);

    const { data, setData, post, processing, errors } = useForm({
        basic_salary: staff.salary_structure?.basic_salary || 0,
        ot_rate_per_hour: staff.salary_structure?.ot_rate_per_hour || 0,
        bonus: staff.salary_structure?.bonus || 0,
        loan_deduction: staff.salary_structure?.loan_deduction || 0,
        leave_deduction: staff.salary_structure?.leave_deduction || 0,
        income_tax: staff.salary_structure?.income_tax || 0,
        allowances: allowances,
        deductions: deductions,
        deduct_epf: staff.salary_structure?.deduct_epf ?? true,
        deduct_etf: staff.salary_structure?.deduct_etf ?? true,
        deduct_tax: staff.salary_structure?.deduct_tax ?? true,
    });

    React.useEffect(() => {
        setTitle(`Salary Structure: ${staff.name}`);
    }, [setTitle, staff]);

    const prefix = company?.currency_prefix || 'LKR';

    const formatValue = (amt: number) => {
        return prefix + ' ' + Number(amt).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const addAllowance = () => {
        const newArr = [...allowances, { label: '', amount: 0 }];
        setAllowances(newArr);
        setData('allowances', newArr);
    };

    const addDeduction = () => {
        const newArr = [...deductions, { label: '', amount: 0 }];
        setDeductions(newArr);
        setData('deductions', newArr);
    };

    const removeAllowance = (index: number) => {
        const newArr = allowances.filter((_, idx) => idx !== index);
        setAllowances(newArr);
        setData('allowances', newArr);
    };

    const removeDeduction = (index: number) => {
        const newArr = deductions.filter((_, idx) => idx !== index);
        setDeductions(newArr);
        setData('deductions', newArr);
    };

    const updateAllowance = (index: number, key: string, val: any) => {
        const newArr = [...allowances];
        newArr[index][key] = val;
        setAllowances(newArr);
        setData('allowances', newArr);
    };

    const updateDeduction = (index: number, key: string, val: any) => {
        const newArr = [...deductions];
        newArr[index][key] = val;
        setDeductions(newArr);
        setData('deductions', newArr);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/staff/${staff.id}/salary`);
    };

    return (
        <div className="max-w-5xl mx-auto pb-12">
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden mb-8">
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 border-b border-slate-200">
                    <h3 className="text-base font-bold text-white tracking-wide">Modify Staff Profile</h3>
                    <p className="text-slate-400 text-xs mt-0.5">Manage personal profiles, corporate designations, and status logs.</p>
                </div>
                <StaffTabs staffId={staff.id} activeTab="salary" />
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
            
            {/* Base Salary Settings Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 border-b border-slate-200">
                    <h3 className="text-base font-bold text-white tracking-wide">Base Salary Settings</h3>
                    <p className="text-slate-400 text-xs mt-0.5">Configure employee primary base salary rate and hourly overtime calculations.</p>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <InputField
                            label={`Basic Salary (${prefix})`}
                            type="number"
                            value={data.basic_salary}
                            onChange={e => setData('basic_salary', parseFloat(e.target.value) || 0)}
                            error={errors.basic_salary}
                        />
                        {data.basic_salary > 0 && (
                            <span className="text-[11px] text-teal-600 font-bold block mt-1.5 bg-teal-50 px-2 py-0.5 rounded border border-teal-100 w-max">
                                Formatted: {formatValue(data.basic_salary)}
                            </span>
                        )}
                    </div>
                    <div>
                        <InputField
                            label={`OT Rate Per Hour (${prefix})`}
                            type="number"
                            value={data.ot_rate_per_hour}
                            onChange={e => setData('ot_rate_per_hour', parseFloat(e.target.value) || 0)}
                            error={errors.ot_rate_per_hour}
                        />
                        {data.ot_rate_per_hour > 0 && (
                            <span className="text-[11px] text-teal-600 font-bold block mt-1.5 bg-teal-50 px-2 py-0.5 rounded border border-teal-100 w-max">
                                Formatted: {formatValue(data.ot_rate_per_hour)}
                            </span>
                        )}
                    </div>
                    {settings?.payroll?.deduct_income_tax && settings?.payroll?.manual_income_tax ? (
                        <div className="col-span-1 md:col-span-2">
                            <InputField
                                label={`Income Tax Override (Monthly ${prefix})`}
                                type="number"
                                value={data.income_tax}
                                onChange={e => setData('income_tax', parseFloat(e.target.value) || 0)}
                                error={errors.income_tax}
                            />
                            {data.income_tax > 0 && (
                                <span className="text-[11px] text-teal-600 font-bold block mt-1.5 bg-teal-50 px-2 py-0.5 rounded border border-teal-100 w-max">
                                    Formatted: {formatValue(data.income_tax)}
                                </span>
                            )}
                        </div>
                    ) : null}
                </div>
            </div>

            {/* Statutory Contributions & Tax Toggles */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 border-b border-slate-200">
                    <h3 className="text-base font-bold text-white tracking-wide">Statutory Deductions & Taxes</h3>
                    <p className="text-slate-400 text-xs mt-0.5">Enable or disable statutory contributions (EPF/ETF) and income tax deductions for this employee.</p>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-center space-x-3 bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <input
                            type="checkbox"
                            id="deduct_epf"
                            checked={data.deduct_epf}
                            onChange={e => setData('deduct_epf', e.target.checked)}
                            className="h-4.5 w-4.5 text-emerald-600 focus:ring-emerald-500/20 border-slate-300 rounded transition cursor-pointer"
                        />
                        <div>
                            <label htmlFor="deduct_epf" className="text-sm font-bold text-slate-700 select-none cursor-pointer block">
                                Deduct EPF Contribution
                            </label>
                            <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                                Employee ({company?.epf_employee_percent || 8}%) & Employer ({company?.epf_employer_percent || 12}%)
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3 bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <input
                            type="checkbox"
                            id="deduct_etf"
                            checked={data.deduct_etf}
                            onChange={e => setData('deduct_etf', e.target.checked)}
                            className="h-4.5 w-4.5 text-emerald-600 focus:ring-emerald-500/20 border-slate-300 rounded transition cursor-pointer"
                        />
                        <div>
                            <label htmlFor="deduct_etf" className="text-sm font-bold text-slate-700 select-none cursor-pointer block">
                                Deduct ETF Contribution
                            </label>
                            <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                                Employer ETF ({company?.etf_percent || 3}%)
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3 bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <input
                            type="checkbox"
                            id="deduct_tax"
                            checked={data.deduct_tax}
                            onChange={e => setData('deduct_tax', e.target.checked)}
                            className="h-4.5 w-4.5 text-emerald-600 focus:ring-emerald-500/20 border-slate-300 rounded transition cursor-pointer"
                        />
                        <div>
                            <label htmlFor="deduct_tax" className="text-sm font-bold text-slate-700 select-none cursor-pointer block">
                                Deduct Income Tax (PAYE)
                            </label>
                            <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                                Automatic or manual income tax calculation
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Salary Adjustments Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 border-b border-slate-200">
                    <h3 className="text-base font-bold text-white tracking-wide">Recurring Adjustments & Deductions</h3>
                    <p className="text-slate-400 text-xs mt-0.5">Manage fixed regular adjustments, standard monthly loan collections, and recurring leave penalties.</p>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <InputField
                            label={`Regular Bonus (${prefix})`}
                            type="number"
                            value={data.bonus}
                            onChange={e => setData('bonus', parseFloat(e.target.value) || 0)}
                            error={errors.bonus}
                        />
                        {data.bonus > 0 && (
                            <span className="text-[11px] text-teal-600 font-bold block mt-1.5 bg-teal-50 px-2 py-0.5 rounded border border-teal-100 w-max">
                                Formatted: {formatValue(data.bonus)}
                            </span>
                        )}
                    </div>
                    <div>
                        <InputField
                            label={`Loan Deduction (${prefix})`}
                            type="number"
                            value={data.loan_deduction}
                            onChange={e => setData('loan_deduction', parseFloat(e.target.value) || 0)}
                            error={errors.loan_deduction}
                        />
                        {data.loan_deduction > 0 && (
                            <span className="text-[11px] text-teal-600 font-bold block mt-1.5 bg-teal-50 px-2 py-0.5 rounded border border-teal-100 w-max">
                                Formatted: {formatValue(data.loan_deduction)}
                            </span>
                        )}
                    </div>
                    <div>
                        <InputField
                            label={`Leave Deduction (${prefix})`}
                            type="number"
                            value={data.leave_deduction}
                            onChange={e => setData('leave_deduction', parseFloat(e.target.value) || 0)}
                            error={errors.leave_deduction}
                        />
                        {data.leave_deduction > 0 && (
                            <span className="text-[11px] text-teal-600 font-bold block mt-1.5 bg-teal-50 px-2 py-0.5 rounded border border-teal-100 w-max">
                                Formatted: {formatValue(data.leave_deduction)}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Custom Allowances & Deductions Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Allowances List Card */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                        <div>
                            <h3 className="text-base font-bold text-white tracking-wide">Dynamic Allowances</h3>
                            <p className="text-slate-400 text-xs mt-0.5">Add custom earnings category types.</p>
                        </div>
                        <button 
                            type="button" 
                            onClick={addAllowance} 
                            className="px-3 py-1 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-md transition"
                        >
                            + Add Item
                        </button>
                    </div>
                    <div className="p-6 space-y-3 flex-1">
                        {allowances.map((item: any, idx: number) => (
                            <div key={idx} className="flex gap-2 items-center bg-slate-50 p-2 rounded-md border border-slate-100">
                                <input 
                                    placeholder="Allowance Name (e.g. Travel)" 
                                    value={item.label} 
                                    onChange={e => updateAllowance(idx, 'label', e.target.value)} 
                                    className="flex-1 text-sm border-gray-300 rounded px-2.5 py-1.5 focus:ring-teal-500 focus:border-teal-500" 
                                />
                                <div className="w-1/3">
                                    <input 
                                        type="number" 
                                        placeholder="Amount" 
                                        value={item.amount} 
                                        onChange={e => updateAllowance(idx, 'amount', parseFloat(e.target.value) || 0)} 
                                        className="w-full text-sm border-gray-300 rounded px-2.5 py-1.5 focus:ring-teal-500 focus:border-teal-500 font-semibold text-slate-850" 
                                    />
                                    {item.amount > 0 && (
                                        <span className="text-[10px] text-teal-600 font-bold block mt-0.5 truncate text-right">
                                            {formatValue(item.amount)}
                                        </span>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeAllowance(idx)}
                                    className="text-rose-600 hover:text-rose-800 p-1.5 rounded-md hover:bg-rose-50 transition active:scale-95 inline-flex items-center justify-center focus:outline-none"
                                    title="Remove Allowance"
                                >
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            </div>
                        ))}
                        {allowances.length === 0 && (
                            <div className="text-center py-8 text-sm text-slate-400 font-medium">
                                No custom allowances assigned.
                            </div>
                        )}
                    </div>
                </div>

                {/* Deductions List Card */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                        <div>
                            <h3 className="text-base font-bold text-white tracking-wide">Custom Deductions</h3>
                            <p className="text-slate-400 text-xs mt-0.5">Add custom penalty or pay-back types.</p>
                        </div>
                        <button 
                            type="button" 
                            onClick={addDeduction} 
                            className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-md transition"
                        >
                            + Add Item
                        </button>
                    </div>
                    <div className="p-6 space-y-3 flex-1">
                        {deductions.map((item: any, idx: number) => (
                            <div key={idx} className="flex gap-2 items-center bg-slate-50 p-2 rounded-md border border-slate-100">
                                <input 
                                    placeholder="Deduction Name (e.g. Welfare)" 
                                    value={item.label} 
                                    onChange={e => updateDeduction(idx, 'label', e.target.value)} 
                                    className="flex-1 text-sm border-gray-300 rounded px-2.5 py-1.5 focus:ring-rose-500 focus:border-rose-500" 
                                />
                                <div className="w-1/3">
                                    <input 
                                        type="number" 
                                        placeholder="Amount" 
                                        value={item.amount} 
                                        onChange={e => updateDeduction(idx, 'amount', parseFloat(e.target.value) || 0)} 
                                        className="w-full text-sm border-gray-300 rounded px-2.5 py-1.5 focus:ring-rose-500 focus:border-rose-500 font-semibold text-slate-850" 
                                    />
                                    {item.amount > 0 && (
                                        <span className="text-[10px] text-rose-600 font-bold block mt-0.5 truncate text-right">
                                            {formatValue(item.amount)}
                                        </span>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeDeduction(idx)}
                                    className="text-rose-600 hover:text-rose-800 p-1.5 rounded-md hover:bg-rose-50 transition active:scale-95 inline-flex items-center justify-center focus:outline-none"
                                    title="Remove Deduction"
                                >
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            </div>
                        ))}
                        {deductions.length === 0 && (
                            <div className="text-center py-8 text-sm text-slate-400 font-medium">
                                No custom deductions assigned.
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Bottom Actions Bar */}
            <div className="flex justify-end pt-4 border-t border-slate-200">
                <Button
                    type="submit"
                    loading={processing}
                    loadingText="Saving..."
                >
                    Update Salary Structure
                </Button>
            </div>
            </form>
        </div>
    );
};

export default StaffSalaryPage;
