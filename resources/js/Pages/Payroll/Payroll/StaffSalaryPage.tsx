import React, { useState } from 'react';
import { useForm, usePage, Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CommonButton from '@/Components/CommonButton';
import CurrencyInput from '@/Components/CurrencyInput';
import EmployeeTabs from '@/Components/EmployeeTabs';
import { TrashIcon, PlusIcon } from '@/src/components/icons/Icons';

const StaffSalaryPage: React.FC = () => {
    const { employee, staff: staffProp, company, auth } = usePage().props as any;
    const staff = employee || staffProp || {};

    const [allowances, setAllowances] = useState(staff.salary_structure?.allowances || staff.salaryStructure?.allowances || []);
    const [deductions, setDeductions] = useState(staff.salary_structure?.deductions || staff.salaryStructure?.deductions || []);

    const structure = staff.salary_structure || staff.salaryStructure || {};

    const { data, setData, post, processing, errors } = useForm({
        basic_salary: structure.basic_salary || 0,
        ot_rate_per_hour: structure.ot_rate_per_hour || 0,
        bonus: structure.bonus || 0,
        loan_deduction: structure.loan_deduction || 0,
        leave_deduction: structure.leave_deduction || 0,
        income_tax: structure.income_tax || 0,
        allowances: allowances,
        deductions: deductions,
        deduct_epf: structure.deduct_epf ?? true,
        deduct_etf: structure.deduct_etf ?? true,
        deduct_tax: structure.deduct_tax ?? true,
    });

    const prefix = company?.currency_prefix || auth?.currency?.prefix || 'LKR';

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
        post(`/employees/${staff.id}/salary`);
    };

    return (
        <AuthenticatedLayout
            user={auth?.user || {}}
            header={<h2 className="font-bold text-lg text-slate-800 tracking-tight">Edit Employee</h2>}
        >
            <Head title={`Salary Structure - ${staff.name || 'Employee'}`} />

            <div className="p-6 max-w-7xl mx-auto space-y-6">
                <div>
                    <div className="mb-3">
                        <Link 
                            href="/employees" 
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
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Salary Structure: {staff.name}</h1>
                            <p className="text-xs text-slate-500 mt-0.5">Configure base remuneration, statutory parameters, and allowances.</p>
                        </div>
                    </div>
                </div>

                <EmployeeTabs employeeId={staff.id} activeTab="salary" />

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
                                onChange={(val: string) => setData('basic_salary', parseFloat(val) || 0)}
                                error={errors.basic_salary}
                                required
                            />
                            <CurrencyInput
                                label="Hourly Overtime (OT) Rate"
                                prefix={prefix}
                                value={data.ot_rate_per_hour}
                                onChange={(val: string) => setData('ot_rate_per_hour', parseFloat(val) || 0)}
                                error={errors.ot_rate_per_hour}
                            />
                        </div>
                    </div>

                    {/* Recurring Monthly Allowances */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 tracking-tight">Recurring Allowances</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Fixed additions added to basic salary each payroll cycle.</p>
                            </div>
                            <CommonButton type="button" variant="secondary" size="xs" onClick={addAllowance}>
                                + Add Allowance
                            </CommonButton>
                        </div>
                        <div className="p-6">
                            {allowances.length === 0 ? (
                                <p className="text-xs text-slate-400 italic text-center py-4">No recurring allowances configured.</p>
                            ) : (
                                <div className="space-y-3">
                                    {allowances.map((al: any, idx: number) => (
                                        <div key={idx} className="flex items-center gap-3">
                                            <input
                                                type="text"
                                                placeholder="Allowance Name (e.g. Transport, Food)"
                                                value={al.label}
                                                onChange={e => updateAllowance(idx, 'label', e.target.value)}
                                                className="flex-1 text-xs border-slate-300 rounded-md focus:ring-primary focus:border-primary"
                                            />
                                            <div className="w-48">
                                                <CurrencyInput
                                                    prefix={prefix}
                                                    value={al.amount}
                                                    onChange={(val: string) => updateAllowance(idx, 'amount', parseFloat(val) || 0)}
                                                />
                                            </div>
                                            <button type="button" onClick={() => removeAllowance(idx)} className="p-1 text-slate-400 hover:text-red-600">
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4">
                        <CommonButton type="button" variant="secondary" href="/employees">
                            Cancel
                        </CommonButton>
                        <CommonButton type="submit" variant="primary" processing={processing}>
                            Update Salary Structure
                        </CommonButton>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
};

export default StaffSalaryPage;
