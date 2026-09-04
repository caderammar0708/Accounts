import React, { useEffect, useState } from 'react';
import { usePage, Head, Link, router as Inertia, Page } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CommonButton from '@/Components/CommonButton';
import { PageProps, Payroll, Payslip } from '@/src/types';
import moment from 'moment';

const PayrollPayslipsPage: React.FC = () => {
    const { payroll, settings, company, auth } = usePage<Page<PageProps>>().props as any;
    const [selectedSlip, setSelectedSlip] = useState<Payslip | null>(null);
    const [editingSlip, setEditingSlip] = useState<Payslip | null>(null);
    const [bonus, setBonus] = useState(0);
    const [loanDeduction, setLoanDeduction] = useState(0);
    const [leaveDeduction, setLeaveDeduction] = useState(0);
    const [activeTab, setActiveTab] = useState<'summary' | 'details'>('summary');

    useEffect(() => {
        if (editingSlip) {
            setBonus(editingSlip.bonus || 0);
            setLoanDeduction(editingSlip.loan_deduction || 0);
            setLeaveDeduction(editingSlip.leave_deduction || 0);
        }
    }, [editingSlip]);

    const handleSaveAdjustments = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSlip) return;

        Inertia.put(`/payslip/${editingSlip.id}/adjustments`, {
            bonus: Number(bonus) || 0,
            loan_deduction: Number(loanDeduction) || 0,
            leave_deduction: Number(leaveDeduction) || 0,
        }, {
            onSuccess: () => {
                setEditingSlip(null);
            }
        });
    };

    const prefix = company?.currency_prefix || auth?.currency?.prefix || 'LKR';

    const formatLKR = (amount: number) => {
        return prefix + ' ' + Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const periodLabel = `${moment().month(payroll.month - 1).format('MMMM')} ${payroll.year}`;

    return (
        <AuthenticatedLayout
            user={auth?.user || {}}
            header={<h2 className="font-bold text-lg text-slate-800 tracking-tight">Payroll Payslips</h2>}
        >
            <Head title={`Payslips - ${periodLabel}`} />

            {/* Print Only CSS */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #payslip-print-modal, #payslip-print-modal * {
                        visibility: visible;
                    }
                    #payslip-print-modal {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        margin: 0;
                        padding: 0;
                        box-shadow: none;
                        border: none;
                        background: white;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}} />

            <div className="p-6 max-w-7xl mx-auto space-y-6">
                <div className="mb-2 no-print">
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

                {/* Summary Card */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
                    <div>
                        <span className="text-2xs font-bold text-primary bg-green-50 px-2 py-0.5 rounded-full border border-green-200 uppercase tracking-wider">Active Cycle</span>
                        <h3 className="text-lg font-bold text-slate-900 mt-1">Payroll Cycle: {periodLabel}</h3>
                        <p className="text-xs text-slate-500">Status: <span className="font-bold text-slate-700">{payroll.status}</span> &bull; {payroll.payslips?.length || 0} Staff payslips generated</p>
                    </div>
                    <div className="flex flex-col items-start md:items-end gap-3 w-full md:w-auto">
                        <div className="text-left md:text-right">
                            <p className="text-2xs font-bold text-slate-400 uppercase tracking-wider">Total Net Payout</p>
                            <p className="text-2xl font-mono font-bold text-slate-900">{formatLKR(payroll.total_amount)}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <CommonButton
                                href={`/payroll/${payroll.id}/export`}
                                variant="primary"
                                size="sm"
                            >
                                Export Summary
                            </CommonButton>
                            <a
                                href={`/payroll/${payroll.id}/export-epf`}
                                className="inline-flex items-center px-2.5 py-1 text-2xs font-bold uppercase tracking-wider bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-md transition-colors"
                            >
                                EPF Summary
                            </a>
                            <a
                                href={`/payroll/${payroll.id}/export-etf`}
                                className="inline-flex items-center px-2.5 py-1 text-2xs font-bold uppercase tracking-wider bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-md transition-colors"
                            >
                                ETF Summary
                            </a>
                            <a
                                href={`/payroll/${payroll.id}/export-tax`}
                                className="inline-flex items-center px-2.5 py-1 text-2xs font-bold uppercase tracking-wider bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-md transition-colors"
                            >
                                Tax Summary
                            </a>
                        </div>
                    </div>
                </div>

                {/* Tab Bar */}
                <div className="border-b border-slate-200 no-print">
                    <nav className="-mb-px flex space-x-8" aria-label="Payslip Views">
                        <button
                            onClick={() => setActiveTab('summary')}
                            className={`whitespace-nowrap py-3 px-1 border-b-2 font-bold text-xs uppercase tracking-wider transition-colors ${
                                activeTab === 'summary'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
                            }`}
                        >
                            Payslip Summary
                        </button>
                        <button
                            onClick={() => setActiveTab('details')}
                            className={`whitespace-nowrap py-3 px-1 border-b-2 font-bold text-xs uppercase tracking-wider transition-colors ${
                                activeTab === 'details'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
                            }`}
                        >
                            Earnings & Deductions Audit
                        </button>
                    </nav>
                </div>

                {activeTab === 'summary' ? (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden no-print">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Employee</th>
                                        <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Basic</th>
                                        <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Allowances</th>
                                        <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Deductions</th>
                                        <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Net Salary</th>
                                        <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-100">
                                    {payroll.payslips.map((slip: Payslip) => (
                                        <tr key={slip.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-3.5 whitespace-nowrap">
                                                <div className="text-xs font-bold text-slate-900">{slip.staff?.name}</div>
                                                <div className="text-2xs text-slate-400 font-mono">{slip.staff?.staff_no}</div>
                                            </td>
                                            <td className="px-6 py-3.5 whitespace-nowrap text-xs font-mono font-medium text-slate-700 text-right">{slip.basic_salary.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td className="px-6 py-3.5 whitespace-nowrap text-xs font-mono font-semibold text-primary text-right">+{slip.allowances?.reduce((a: number, b: any) => a + Number(b.amount), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td className="px-6 py-3.5 whitespace-nowrap text-xs font-mono font-semibold text-rose-600 text-right">-{((slip.deductions?.reduce((a: number, b: any) => a + Number(b.amount), 0) || 0) + (slip.epf_employee || 0) + (slip.income_tax || 0) + (slip.advance_deduction || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td className="px-6 py-3.5 whitespace-nowrap text-xs font-mono font-bold text-slate-900 text-right">{formatLKR(slip.net_salary)}</td>
                                            <td className="px-6 py-3.5 whitespace-nowrap text-right text-xs font-medium space-x-2">
                                                <a
                                                    href={`/payslip/${slip.id}/pdf`}
                                                    target="_blank"
                                                    className="inline-flex items-center px-2.5 py-1 text-2xs font-bold text-primary hover:bg-green-50 rounded-md border border-green-200 transition-colors"
                                                >
                                                    View PDF
                                                </a>
                                                {payroll.status !== 'Paid' && (
                                                    <button
                                                        onClick={() => setEditingSlip(slip)}
                                                        className="inline-flex items-center px-2.5 py-1 text-2xs font-bold text-slate-700 hover:bg-slate-50 rounded-md border border-slate-200 transition-colors"
                                                    >
                                                        Adjust
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden no-print">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th rowSpan={2} className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest align-middle border-r border-slate-200">Employee</th>
                                        <th rowSpan={2} className="px-4 py-3 text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest align-middle border-r border-slate-200">Basic</th>
                                        <th colSpan={3} className="px-4 py-2 text-center text-[10px] font-bold text-primary uppercase tracking-widest border-b border-r border-slate-200 bg-green-50/50">Earnings</th>
                                        <th colSpan={5} className="px-4 py-2 text-center text-[10px] font-bold text-rose-700 uppercase tracking-widest border-b border-r border-slate-200 bg-rose-50/50">Deductions</th>
                                        <th rowSpan={2} className="px-4 py-3 text-right text-[10px] font-bold text-slate-800 uppercase tracking-widest align-middle">Net Payout</th>
                                    </tr>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-3 py-2 text-right text-[9px] font-bold text-primary uppercase tracking-wider border-r border-slate-100">Allowances</th>
                                        <th className="px-3 py-2 text-right text-[9px] font-bold text-primary uppercase tracking-wider border-r border-slate-100">OT</th>
                                        <th className="px-3 py-2 text-right text-[9px] font-bold text-primary uppercase tracking-wider border-r border-slate-200">Bonus</th>

                                        <th className="px-3 py-2 text-right text-[9px] font-bold text-rose-600 uppercase tracking-wider border-r border-slate-100">EPF (EE)</th>
                                        <th className="px-3 py-2 text-right text-[9px] font-bold text-rose-600 uppercase tracking-wider border-r border-slate-100">Tax</th>
                                        <th className="px-3 py-2 text-right text-[9px] font-bold text-rose-600 uppercase tracking-wider border-r border-slate-100">Loans</th>
                                        <th className="px-3 py-2 text-right text-[9px] font-bold text-rose-600 uppercase tracking-wider border-r border-slate-100">Leaves</th>
                                        <th className="px-3 py-2 text-right text-[9px] font-bold text-rose-600 uppercase tracking-wider border-r border-slate-200">Advances</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-100 text-xs">
                                    {payroll.payslips.map((slip: Payslip) => {
                                        const allowancesTotal = slip.allowances?.reduce((a: number, b: any) => a + Number(b.amount), 0) || 0;
                                        return (
                                            <tr key={slip.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-4 py-3 font-bold text-slate-900 border-r border-slate-100">
                                                    <div>{slip.staff?.name}</div>
                                                    <div className="text-[10px] text-slate-400 font-mono font-normal">{slip.staff?.staff_no}</div>
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono text-slate-700 border-r border-slate-100">{slip.basic_salary.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>

                                                <td className="px-3 py-3 text-right font-mono text-primary font-semibold border-r border-slate-100">{allowancesTotal > 0 ? allowancesTotal.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                                                <td className="px-3 py-3 text-right font-mono text-primary font-semibold border-r border-slate-100">{slip.ot_amount > 0 ? slip.ot_amount.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                                                <td className="px-3 py-3 text-right font-mono text-primary font-bold border-r border-slate-200">{slip.bonus > 0 ? slip.bonus.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>

                                                <td className="px-3 py-3 text-right font-mono text-rose-600 border-r border-slate-100">{slip.epf_employee > 0 ? formatLKR(slip.epf_employee) : '-'}</td>
                                                <td className="px-3 py-3 text-right font-mono text-rose-600 border-r border-slate-100">{slip.income_tax > 0 ? formatLKR(slip.income_tax) : '-'}</td>
                                                <td className="px-3 py-3 text-right font-mono text-rose-600 border-r border-slate-100">{slip.loan_deduction > 0 ? formatLKR(slip.loan_deduction) : '-'}</td>
                                                <td className="px-3 py-3 text-right font-mono text-rose-600 border-r border-slate-100">{slip.leave_deduction > 0 ? formatLKR(slip.leave_deduction) : '-'}</td>
                                                <td className="px-3 py-3 text-right font-mono text-rose-600 border-r border-slate-200">{(slip.advance_deduction || 0) > 0 ? formatLKR(slip.advance_deduction || 0) : '-'}</td>

                                                <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 bg-slate-50/40">{formatLKR(slip.net_salary)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Adjustment Modal */}
                {editingSlip && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto no-print">
                        <div className="bg-white w-full max-w-md rounded-xl shadow-xl overflow-hidden border border-slate-200 flex flex-col">
                            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                                <h3 className="font-bold text-slate-800 text-sm">Adjust Monthly Payslip</h3>
                                <button
                                    onClick={() => setEditingSlip(null)}
                                    className="text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <form onSubmit={handleSaveAdjustments} className="p-6 space-y-4">
                                <div>
                                    <span className="text-xs font-bold text-slate-600 block mb-1">Employee</span>
                                    <div className="text-xs text-slate-900 font-bold bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                                        {editingSlip.staff?.name} ({editingSlip.staff?.staff_no})
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Bonus ({prefix})</label>
                                    <input
                                        type="number"
                                        value={bonus}
                                        onChange={e => setBonus(parseFloat(e.target.value) || 0)}
                                        className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary text-xs font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Loan Deduction ({prefix})</label>
                                    <input
                                        type="number"
                                        value={loanDeduction}
                                        onChange={e => setLoanDeduction(parseFloat(e.target.value) || 0)}
                                        className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary text-xs font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Leave Deduction ({prefix})</label>
                                    <input
                                        type="number"
                                        value={leaveDeduction}
                                        onChange={e => setLeaveDeduction(parseFloat(e.target.value) || 0)}
                                        className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary text-xs font-mono"
                                    />
                                </div>

                                <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                                    <CommonButton
                                        variant="secondary"
                                        onClick={() => setEditingSlip(null)}
                                    >
                                        Cancel
                                    </CommonButton>
                                    <CommonButton
                                        type="submit"
                                        variant="primary"
                                    >
                                        Save Adjustments
                                    </CommonButton>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
};

export default PayrollPayslipsPage;
