import React from 'react';
import { Link, useForm, Head, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CommonButton from '@/Components/CommonButton';
import moment from 'moment';
import { MonthField, TextareaField } from '@/src/components/ui/InputFeild';

const PayrollFormPage: React.FC = () => {
    const { auth } = usePage().props as any;
    
    // Format YYYY-MM
    const currentMonth = moment().month() + 1;
    const initialMonthStr = `${moment().year()}-${currentMonth.toString().padStart(2, '0')}`;

    const { data, setData, post, processing, errors } = useForm({
        monthStr: initialMonthStr,
        month: currentMonth,
        year: moment().year(),
        comment: '',
    });

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
        <AuthenticatedLayout
            user={auth?.user || {}}
            header={<h2 className="font-bold text-lg text-slate-800 tracking-tight">Generate Payroll</h2>}
        >
            <Head title="Generate Monthly Payroll" />

            <div className="p-6 max-w-2xl mx-auto space-y-4">
                <div className="mb-2">
                    <Link 
                        href="/payroll" 
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-primary transition-colors uppercase tracking-wider"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Payroll
                    </Link>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="text-sm font-bold text-slate-800 tracking-tight">Generate Monthly Payroll</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Configure and initialize automated salary calculations for the selected cycle.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Validation Errors Banner */}
                        {Object.keys(errors).length > 0 && (
                            <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 text-rose-800 flex gap-3">
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

                        <div className="space-y-4">
                            <MonthField
                                label="Target Month & Year"
                                name="monthStr"
                                value={data.monthStr}
                                onChange={handleMonthChange}
                                error={errors.month || errors.year}
                            />

                            <TextareaField
                                label="Remarks / Comment"
                                name="comment"
                                rows={3}
                                placeholder="Any notes or comments regarding this payroll generation..."
                                value={data.comment}
                                onChange={e => setData('comment', e.target.value)}
                                error={errors.comment}
                            />
                        </div>

                        {/* Info Notice */}
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex gap-3 text-emerald-800">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                            </svg>
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900">System Calculation Notice</h4>
                                <p className="text-xs text-emerald-700 font-medium mt-1 leading-relaxed">
                                    Initializing payroll will compute net earnings, deductions, overtime, and statutory parameters for active employees based on current salary structures.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-end pt-4 border-t border-slate-100 gap-3">
                            <CommonButton 
                                type="button" 
                                variant="secondary" 
                                href="/payroll"
                            >
                                Cancel
                            </CommonButton>
                            
                            <CommonButton
                                type="submit"
                                variant="primary"
                                processing={processing}
                            >
                                Run Payroll
                            </CommonButton>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default PayrollFormPage;
