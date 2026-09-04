import React from 'react';
import { useForm } from '@inertiajs/react';
import HRSettingsLayout from './HRSettingsLayout';
import CommonButton from '@/Components/CommonButton';
import CommonInput from '@/Components/CommonInput';

export default function Payroll({ settings }) {
    const { data, setData, post, processing, errors, isDirty } = useForm({
        basic_salary_percentage: settings?.basic_salary_percentage || 0,
        allowance_percentage: settings?.allowance_percentage || 0,
        epf_employee_percentage: settings?.epf_employee_percentage || 0,
        epf_employer_percentage: settings?.epf_employer_percentage || 0,
        etf_employer_percentage: settings?.etf_employer_percentage || 0,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('settings.hr.payroll.update'), {
            preserveScroll: true,
        });
    };

    return (
        <HRSettingsLayout activeTab="payroll">
            <form onSubmit={handleSubmit} className="max-w-5xl space-y-6 pb-12">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="text-sm font-bold text-slate-800">Salary Component & Statutory Calculations</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Configure base salary components and statutory contribution percentages.</p>
                    </div>
                    
                    <div className="p-6 space-y-6">
                        <div>
                            <h4 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-4">Salary Breakdown (%)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <CommonInput
                                    label="Basic Salary Component (%)"
                                    type="number"
                                    step="0.01"
                                    value={data.basic_salary_percentage}
                                    onChange={e => setData('basic_salary_percentage', e.target.value)}
                                    error={errors.basic_salary_percentage}
                                />
                                <CommonInput
                                    label="Allowance Component (%)"
                                    type="number"
                                    step="0.01"
                                    value={data.allowance_percentage}
                                    onChange={e => setData('allowance_percentage', e.target.value)}
                                    error={errors.allowance_percentage}
                                />
                            </div>
                        </div>

                        <div className="border-t border-slate-100 pt-6">
                            <h4 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-4">Statutory Contribution Percentages (%)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <CommonInput
                                    label="Employee EPF Contribution (%)"
                                    type="number"
                                    step="0.01"
                                    value={data.epf_employee_percentage}
                                    onChange={e => setData('epf_employee_percentage', e.target.value)}
                                    error={errors.epf_employee_percentage}
                                />
                                <CommonInput
                                    label="Employer EPF Contribution (%)"
                                    type="number"
                                    step="0.01"
                                    value={data.epf_employer_percentage}
                                    onChange={e => setData('epf_employer_percentage', e.target.value)}
                                    error={errors.epf_employer_percentage}
                                />
                                <CommonInput
                                    label="Employer ETF Contribution (%)"
                                    type="number"
                                    step="0.01"
                                    value={data.etf_employer_percentage}
                                    onChange={e => setData('etf_employer_percentage', e.target.value)}
                                    error={errors.etf_employer_percentage}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-2 gap-3">
                    <CommonButton type="submit" variant="primary" processing={processing} disabled={!isDirty || processing}>
                        Save Configuration
                    </CommonButton>
                </div>
            </form>
        </HRSettingsLayout>
    );
}
