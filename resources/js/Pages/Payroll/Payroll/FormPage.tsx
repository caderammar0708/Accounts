import React, { useEffect } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { usePageHeader } from '@/src/App';
import moment from 'moment';
import Button from '@/src/components/ui/Button';
import { MonthField, TextareaField } from '@/src/components/ui/InputFeild';

const PayrollFormPage: React.FC = () => {
    const { setTitle } = usePageHeader();
    
    // Format YYYY-MM
    const currentMonth = moment().month() + 1;
    const initialMonthStr = `${moment().year()}-${currentMonth.toString().padStart(2, '0')}`;

    const { data, setData, post, processing, errors } = useForm({
        monthStr: initialMonthStr,
        month: currentMonth,
        year: moment().year(),
        comment: '',
    });

    useEffect(() => {
        setTitle('Generate Monthly Payroll');
    }, [setTitle]);

    const handleMonthChange = (val: string) => {
        if (!val) return;
        const [y, m] = val.split('-');
        setData(data => ({
            ...data,
            monthStr: val,
            month: parseInt(m),
            year: parseInt(y)
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/payroll');
    };

    return (
        <div className="pb-12 pt-6">
            <div className="max-w-xl mx-auto bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
                
                {/* Modern Slate Header Banner */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-5 border-b border-slate-200">
                    <h3 className="text-base font-bold text-white tracking-wide">Generate Monthly Payroll</h3>
                    <p className="text-slate-400 text-xs mt-1">Configure and initialize the automated salary calculations for the selected month.</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    
                    {/* Validation Errors Banner */}
                    {Object.keys(errors).length > 0 && (
                        <div className="bg-rose-50 border border-rose-100 rounded-xl p-4.5 text-rose-800 flex gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 text-rose-600 shrink-0 mt-0.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                            </svg>
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-900">Payroll Generation Blocked</h4>
                                <ul className="list-disc pl-4 mt-1.5 space-y-1 text-xs text-rose-700 font-medium">
                                    {Object.values(errors).map((err, i) => (
                                        <li key={i}>{err}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Grid Inputs */}
                    <div className="grid grid-cols-1 gap-5">
                        
                        {/* Month/Year Selector */}
                        <MonthField
                            label="Target Month & Year"
                            name="monthStr"
                            value={data.monthStr}
                            onChange={handleMonthChange}
                            error={errors.month || errors.year}
                        />
                    </div>

                    {/* Comment Field */}
                    <TextareaField
                        label="Remarks / Comment"
                        name="comment"
                        rows={3}
                        placeholder="Any notes or comments regarding this payroll generation..."
                        value={data.comment}
                        onChange={e => setData('comment', e.target.value)}
                        error={errors.comment}
                    />

                    {/* Premium Alerts Banner */}
                    <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-4.5 flex gap-3 text-emerald-800">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        </svg>
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900">System Calculation Notice</h4>
                            <p className="text-xs text-emerald-700 font-medium mt-1 leading-relaxed">
                                Initializing payroll will automatically compute net earnings, deductions, overtime rates, and allowances for all active employees for the selected period based on their configured salary structures.
                            </p>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end pt-5 border-t border-slate-100 gap-3">
                        <Link 
                            href="/payroll" 
                            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-lg border border-slate-200 transition duration-150 active:scale-[0.98]"
                        >
                            Cancel
                        </Link>
                        
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-sm font-bold rounded-lg shadow-sm transition duration-150 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center min-w-[130px]"
                        >
                            {processing ? 'Processing...' : 'Run Payroll'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PayrollFormPage;
