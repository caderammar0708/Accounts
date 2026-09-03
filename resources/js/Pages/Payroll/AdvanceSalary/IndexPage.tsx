import React, { useState } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import { usePageHeader } from '@/src/App';
import { router as Inertia, Page } from '@inertiajs/react';
import { PageProps } from '@/src/types';
import { PlusIcon, TrashIcon } from '@/src/components/icons/Icons';
import moment from 'moment';
import Button from '@/src/components/ui/Button';

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
}

interface PagePropsType {
    advances: AdvanceSalary[];
    employees: Staff[];
}

const AdvanceSalaryPage: React.FC = () => {
    const { advances, employees, company } = usePage<Page<PageProps>>().props as any;
    const { setTitle, setActions } = usePageHeader();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        employee_id: '',
        amount: '',
        recovery_mode: 'Lumpsum' as 'Lumpsum' | 'Installment',
        installments: '1',
        recover_from_month: (new Date().getMonth() + 1).toString(),
        recover_from_year: new Date().getFullYear().toString(),
    });

    React.useEffect(() => {
        setTitle('Advance Salaries');
    }, [setTitle]);

    const prefix = company?.currency_prefix || 'LKR';

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

    return (
        <div className="space-y-6 pb-12">
            
            {/* Payouts Table List */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                    <div>
                        <h3 className="text-base font-bold text-white tracking-wide">Advance Salary Payouts</h3>
                        <p className="text-slate-400 text-xs mt-0.5">Manage recorded advance salaries and track their outstanding balance recoveries.</p>
                    </div>
                    <Button
                        onClick={() => {
                            reset();
                            setIsModalOpen(true);
                        }}
                        icon={<PlusIcon className="h-4 w-4" />}
                    >
                        Record Advance Payout
                    </Button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Employee ID</th>
                                <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Employee Name</th>
                                <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Amount ({prefix})</th>
                                <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Recovery Mode</th>
                                <th className="px-6 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Installments</th>
                                <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Recovered</th>
                                <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Outstanding</th>
                                <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Recover From</th>
                                <th className="px-6 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                            {advances.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-6 py-10 text-center text-sm text-slate-400 italic">No advance salaries recorded. Click "Record Advance Payout" to add.</td>
                                </tr>
                            ) : (
                                advances.map((adv) => {
                                    const outstanding = adv.amount - adv.recovered_amount;
                                    return (
                                        <tr key={adv.id} className="hover:bg-slate-50/60 transition">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">{adv.employee_id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{adv.staff?.name ?? 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-slate-950">{prefix} {adv.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${adv.recovery_mode === 'Lumpsum' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                                                    {adv.recovery_mode}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-slate-700">{adv.installments}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-slate-500">{prefix} {adv.recovered_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-rose-600">{prefix} {outstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                {moment().month(adv.recover_from_month - 1).format('MMM')} {adv.recover_from_year}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                                    adv.status === 'Fully Recovered' ? 'bg-green-100 text-green-800' :
                                                    adv.status === 'Cancelled' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                                                }`}>
                                                    {adv.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                {adv.recovered_amount === 0 && adv.status === 'Approved' && (
                                                    <button onClick={() => handleDelete(adv.id)} className="text-red-500 hover:text-red-700 transition">
                                                        <TrashIcon className="h-4 w-4 inline" /> Delete
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden border border-slate-200">
                        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 flex justify-between items-center">
                            <div>
                                <h3 className="text-base font-bold text-white tracking-wide">Record Advance Salary Payout</h3>
                                <p className="text-slate-400 text-xs mt-0.5">Issue an upfront salary advance with automated payslip deductions.</p>
                            </div>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="text-slate-400 hover:text-white transition focus:outline-none"
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            
                            {/* Employee select */}
                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Select Staff Member</label>
                                <select 
                                    className="w-full text-sm border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-lg mt-1"
                                    value={data.employee_id}
                                    onChange={e => setData('employee_id', e.target.value)}
                                    required
                                >
                                    <option value="">-- Choose Employee --</option>
                                    {employees.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.staff_no})</option>
                                    ))}
                                </select>
                                {errors.employee_id && <span className="text-red-500 text-xs block">{errors.employee_id}</span>}
                            </div>

                            {/* Payout Amount */}
                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Advance Payout Amount ({prefix})</label>
                                <input 
                                    type="number"
                                    min="1"
                                    placeholder="e.g. 50000"
                                    className="w-full text-sm border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-lg mt-1 font-semibold"
                                    value={data.amount}
                                    onChange={e => setData('amount', e.target.value)}
                                    required
                                />
                                {errors.amount && <span className="text-red-500 text-xs block">{errors.amount}</span>}
                                {parseFloat(data.amount) > 0 && (
                                    <span className="text-[11px] text-teal-600 font-bold block mt-1">
                                        Formatted: {prefix} {parseFloat(data.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                )}
                            </div>

                            {/* Recovery Mode */}
                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Recovery Mode</label>
                                <select 
                                    className="w-full text-sm border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-lg mt-1"
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
                                {errors.recovery_mode && <span className="text-red-500 text-xs block">{errors.recovery_mode}</span>}
                            </div>

                            {/* Installment count */}
                            {data.recovery_mode === 'Installment' && (
                                <div className="space-y-1 bg-blue-50/50 border border-blue-200/50 p-4 rounded-lg animate-fade-in">
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Number of Installments</label>
                                    <input 
                                        type="number"
                                        min="1"
                                        placeholder="e.g. 6"
                                        className="w-full text-sm border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-lg mt-1"
                                        value={data.installments}
                                        onChange={e => setData('installments', e.target.value)}
                                        required
                                    />
                                    {errors.installments && <span className="text-red-500 text-xs block">{errors.installments}</span>}
                                </div>
                            )}

                            {/* Start month and year */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Recover From Month</label>
                                    <select 
                                        className="w-full text-sm border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-lg mt-1"
                                        value={data.recover_from_month}
                                        onChange={e => setData('recover_from_month', e.target.value)}
                                        required
                                    >
                                        {Array.from({ length: 12 }, (_, i) => (
                                            <option key={i + 1} value={i + 1}>{moment().month(i).format('MMMM')}</option>
                                        ))}
                                    </select>
                                    {errors.recover_from_month && <span className="text-red-500 text-xs block">{errors.recover_from_month}</span>}
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Recover From Year</label>
                                    <select 
                                        className="w-full text-sm border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-lg mt-1"
                                        value={data.recover_from_year}
                                        onChange={e => setData('recover_from_year', e.target.value)}
                                        required
                                    >
                                        {Array.from({ length: 5 }, (_, i) => {
                                            const y = new Date().getFullYear() + i;
                                            return <option key={y} value={y}>{y}</option>;
                                        })}
                                    </select>
                                    {errors.recover_from_year && <span className="text-red-500 text-xs block">{errors.recover_from_year}</span>}
                                </div>
                            </div>

                            {/* Modal actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <Button
                                    variant="secondary"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    loading={processing}
                                    loadingText="Saving..."
                                >
                                    Record Payout
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdvanceSalaryPage;
