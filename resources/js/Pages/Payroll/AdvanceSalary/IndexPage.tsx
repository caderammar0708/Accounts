import React, { useState } from 'react';
import { useForm, usePage, Head, router as Inertia, Page } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CommonButton from '@/Components/CommonButton';
import CurrencyInput from '@/Components/CurrencyInput';
import { PageProps } from '@/src/types';
import { TrashIcon } from '@/src/components/icons/Icons';
import moment from 'moment';

interface AdvanceSalary {
    id: number;
    employee_id: string;
    amount: number;
    recovery_mode: 'Lumpsum' | 'Installment';
    installments: number;
    recovered_amount: number;
    recover_from_month: number;
    recover_from_year: number;
    status: 'Approved' | 'Fully Recovered' | 'Cancelled';
    staff?: {
        name: string;
    };
    created_at: string;
}

interface Staff {
    id: number;
    name: string;
    staff_no?: string;
}

interface Props {
    isEmbedded?: boolean;
}

const AdvanceSalaryPage: React.FC<Props> = ({ isEmbedded = false }) => {
    const { advances = [], employees = [], company, auth } = usePage<Page<PageProps>>().props as any;
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        employee_id: '',
        amount: '',
        recovery_mode: 'Lumpsum' as 'Lumpsum' | 'Installment',
        installments: '1',
        recover_from_month: (new Date().getMonth() + 1).toString(),
        recover_from_year: new Date().getFullYear().toString(),
    });

    const prefix = company?.currency_prefix || auth?.currency?.prefix || 'LKR';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/advance-salary', {
            onSuccess: () => {
                setIsModalOpen(false);
                reset();
            }
        });
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to cancel this advance salary plan?')) {
            Inertia.delete(`/advance-salary/${id}`);
        }
    };

    const content = (
        <div className="space-y-6">
            {/* Payouts Table List */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 tracking-tight">Advance Salary Payouts</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Manage recorded advance salaries and track their outstanding balance recoveries.</p>
                    </div>
                    <CommonButton
                        variant="primary"
                        onClick={() => {
                            reset();
                            setIsModalOpen(true);
                        }}
                    >
                        + Record Advance Payout
                    </CommonButton>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Employee</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Amount ({prefix})</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Mode</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Installments</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Recovered</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Outstanding</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Recover From</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Status</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                            {advances.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-12 text-center text-slate-400 text-xs font-medium">
                                        No advance salaries recorded. Click "+ Record Advance Payout" to add.
                                    </td>
                                </tr>
                            ) : (
                                advances.map((adv: AdvanceSalary) => {
                                    const outstanding = adv.amount - adv.recovered_amount;
                                    return (
                                        <tr key={adv.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                <div className="text-xs font-bold text-slate-900">{adv.staff?.name ?? 'N/A'}</div>
                                                <div className="text-2xs text-slate-400 font-mono">{adv.employee_id}</div>
                                            </td>
                                            <td className="px-4 py-3.5 whitespace-nowrap text-xs font-mono font-bold text-slate-900 text-right">
                                                {prefix} {adv.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-4 py-3.5 whitespace-nowrap text-center">
                                                <span className={`px-2 py-0.5 rounded-full text-2xs font-bold ${
                                                    adv.recovery_mode === 'Lumpsum' ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-blue-50 text-blue-800 border border-blue-200'
                                                }`}>
                                                    {adv.recovery_mode}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 whitespace-nowrap text-xs text-center font-mono font-semibold text-slate-700">{adv.installments}</td>
                                            <td className="px-4 py-3.5 whitespace-nowrap text-xs font-mono text-right font-medium text-slate-500">
                                                {prefix} {adv.recovered_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-4 py-3.5 whitespace-nowrap text-xs font-mono text-right font-bold text-rose-600">
                                                {prefix} {outstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-4 py-3.5 whitespace-nowrap text-xs text-slate-600">
                                                {moment().month(adv.recover_from_month - 1).format('MMM')} {adv.recover_from_year}
                                            </td>
                                            <td className="px-4 py-3.5 whitespace-nowrap text-center">
                                                <span className={`px-2.5 py-0.5 rounded-full text-2xs font-bold ${
                                                    adv.status === 'Fully Recovered' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                                                    adv.status === 'Cancelled' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-green-50 text-primary border border-green-200'
                                                }`}>
                                                    {adv.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 whitespace-nowrap text-right text-xs font-medium">
                                                {adv.recovered_amount === 0 && adv.status === 'Approved' && (
                                                    <button 
                                                        onClick={() => handleDelete(adv.id)} 
                                                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                                                        title="Cancel Advance"
                                                    >
                                                        <TrashIcon className="h-4 w-4 inline" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Record Advance Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                    <div className="bg-white w-full max-w-lg rounded-xl shadow-xl overflow-hidden border border-slate-200">
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 tracking-tight">Record Advance Salary Payout</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Issue an upfront salary advance with automated payslip deductions.</p>
                            </div>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-slate-600">Select Staff Member</label>
                                <select 
                                    className="w-full text-xs border-slate-300 focus:border-primary focus:ring-primary rounded-md"
                                    value={data.employee_id}
                                    onChange={e => setData('employee_id', e.target.value)}
                                    required
                                >
                                    <option value="">-- Choose Employee --</option>
                                    {employees.map((s: Staff) => (
                                        <option key={s.id} value={s.id}>{s.name} {s.staff_no ? `(${s.staff_no})` : ''}</option>
                                    ))}
                                </select>
                                {errors.employee_id && <span className="text-rose-500 text-xs block">{errors.employee_id}</span>}
                            </div>

                            <CurrencyInput
                                label="Advance Payout Amount"
                                prefix={prefix}
                                value={data.amount}
                                onChange={(val: string) => setData('amount', val)}
                                error={errors.amount}
                                required
                            />

                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-slate-600">Recovery Mode</label>
                                <select 
                                    className="w-full text-xs border-slate-300 focus:border-primary focus:ring-primary rounded-md"
                                    value={data.recovery_mode}
                                    onChange={e => {
                                        const mode = e.target.value as 'Lumpsum' | 'Installment';
                                        setData(prev => ({
                                            ...prev,
                                            recovery_mode: mode,
                                            installments: mode === 'Lumpsum' ? '1' : prev.installments
                                        }));
                                    }}
                                    required
                                >
                                    <option value="Lumpsum">Lumpsum (One-off deduction)</option>
                                    <option value="Installment">Installment (Splitted over months)</option>
                                </select>
                                {errors.recovery_mode && <span className="text-rose-500 text-xs block">{errors.recovery_mode}</span>}
                            </div>

                            {data.recovery_mode === 'Installment' && (
                                <div className="space-y-1 bg-slate-50 border border-slate-200 p-3 rounded-lg">
                                    <label className="block text-xs font-bold text-slate-700">Number of Installments</label>
                                    <input 
                                        type="number"
                                        min="1"
                                        placeholder="e.g. 6"
                                        className="w-full text-xs font-mono border-slate-300 focus:border-primary focus:ring-primary rounded-md mt-1"
                                        value={data.installments}
                                        onChange={e => setData('installments', e.target.value)}
                                        required
                                    />
                                    {errors.installments && <span className="text-rose-500 text-xs block">{errors.installments}</span>}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-600">Recover From Month</label>
                                    <select 
                                        className="w-full text-xs border-slate-300 focus:border-primary focus:ring-primary rounded-md"
                                        value={data.recover_from_month}
                                        onChange={e => setData('recover_from_month', e.target.value)}
                                        required
                                    >
                                        {Array.from({ length: 12 }, (_, i) => (
                                            <option key={i + 1} value={i + 1}>{moment().month(i).format('MMMM')}</option>
                                        ))}
                                    </select>
                                    {errors.recover_from_month && <span className="text-rose-500 text-xs block">{errors.recover_from_month}</span>}
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-600">Recover From Year</label>
                                    <select 
                                        className="w-full text-xs border-slate-300 focus:border-primary focus:ring-primary rounded-md"
                                        value={data.recover_from_year}
                                        onChange={e => setData('recover_from_year', e.target.value)}
                                        required
                                    >
                                        {Array.from({ length: 5 }, (_, i) => {
                                            const y = new Date().getFullYear() + i;
                                            return <option key={y} value={y}>{y}</option>;
                                        })}
                                    </select>
                                    {errors.recover_from_year && <span className="text-rose-500 text-xs block">{errors.recover_from_year}</span>}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <CommonButton
                                    variant="secondary"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Cancel
                                </CommonButton>
                                <CommonButton
                                    type="submit"
                                    variant="primary"
                                    processing={processing}
                                >
                                    Record Payout
                                </CommonButton>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );

    if (isEmbedded) {
        return content;
    }

    return (
        <AuthenticatedLayout
            user={auth?.user || {}}
            header={<h2 className="font-bold text-lg text-slate-800 tracking-tight">Advance Salaries</h2>}
        >
            <Head title="Advance Salaries" />
            <div className="p-6 max-w-7xl mx-auto space-y-6">
                {content}
            </div>
        </AuthenticatedLayout>
    );
};

export default AdvanceSalaryPage;
