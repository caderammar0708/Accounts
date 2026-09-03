import React, { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { usePageHeader } from '@/src/App';
import { PageProps, Payroll, Payslip } from '@/src/types';

import moment from 'moment';
import Button from '@/src/components/ui/Button';

const PayrollPayslipsPage: React.FC = () => {
    const { payroll, settings, company } = usePage<Page<PageProps>>().props as any;
    const { setTitle } = usePageHeader();
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

    useEffect(() => {
        setTitle(`Payslips: ${moment().month(payroll.month - 1).format('MMMM')} ${payroll.year}`);
    }, [setTitle, payroll]);

    const formatLKR = (amount: number) => {
        const prefix = company?.currency_prefix || 'LKR';
        return prefix + ' ' + Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-6">
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

            <div className="bg-white p-6 rounded-lg border border-gray-200 flex justify-between items-center shadow-sm no-print">
                <div>
                    <h3 className="text-xl font-bold text-gray-800">Payroll Summary</h3>
                    <p className="text-sm text-gray-500">Period: {moment().month(payroll.month - 1).format('MMMM')} {payroll.year}</p>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                    <div>
                        <p className="text-sm text-gray-500">Total Net Payout</p>
                        <p className="text-2xl font-black text-green-700">{formatLKR(payroll.total_amount)}</p>
                    </div>
                    <a
                        href={`/payroll/${payroll.id}/export`}
                        className="px-8 py-2.5 text-sm font-bold rounded-lg shadow-sm transition duration-150 disabled:opacity-50 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 active:scale-[0.98] select-none bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white border border-transparent"
                    >
                        Export Salary Summary
                    </a>
                    <div className="flex gap-2 mt-2">
                        <a
                            href={`/payroll/${payroll.id}/export-epf`}
                            className="inline-flex items-center gap-1 bg-slate-600 hover:bg-slate-700 text-white px-3 py-1.5 rounded-md text-xs font-semibold transition-colors"
                        >
                            EPF Summary
                        </a>
                        <a
                            href={`/payroll/${payroll.id}/export-etf`}
                            className="inline-flex items-center gap-1 bg-slate-600 hover:bg-slate-700 text-white px-3 py-1.5 rounded-md text-xs font-semibold transition-colors"
                        >
                            ETF Summary
                        </a>
                        <a
                            href={`/payroll/${payroll.id}/export-tax`}
                            className="inline-flex items-center gap-1 bg-slate-600 hover:bg-slate-700 text-white px-3 py-1.5 rounded-md text-xs font-semibold transition-colors"
                        >
                            Tax Summary
                        </a>
                    </div>
                </div>
            </div>

            {/* Tab Bar */}
            <div className="flex border-b border-gray-200 no-print">
                <button
                    onClick={() => setActiveTab('summary')}
                    className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all duration-150 ${activeTab === 'summary' ? 'border-teal-600 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Payslip Summary
                </button>
                <button
                    onClick={() => setActiveTab('details')}
                    className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all duration-150 ${activeTab === 'details' ? 'border-teal-600 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Earnings & Deductions Audit
                </button>
            </div>

            {activeTab === 'summary' ? (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm no-print">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Basic</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Allowances</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deductions</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Salary</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {payroll.payslips.map((slip: Payslip) => (
                                <tr key={slip.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{slip.staff?.name}</div>
                                        <div className="text-xs text-gray-500">{slip.staff?.staff_no}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{slip.basic_salary.toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">+{slip.allowances?.reduce((a: number, b: any) => a + Number(b.amount), 0).toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">-{((slip.deductions?.reduce((a: number, b: any) => a + Number(b.amount), 0) || 0) + (slip.epf_employee || 0) + (slip.income_tax || 0) + (slip.advance_deduction || 0)).toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">{formatLKR(slip.net_salary)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                                        <a
                                            href={`/payslip/${slip.id}/pdf`}
                                            target="_blank"
                                            className="text-green-600 hover:text-green-800 font-medium hover:underline bg-green-50 px-3 py-1.5 rounded-md border border-green-100 transition-colors inline-block"
                                        >
                                            View Payslip
                                        </a>
                                        {payroll.status !== 'Paid' && (
                                            <button
                                                onClick={() => setEditingSlip(slip)}
                                                className="text-blue-600 hover:text-blue-800 font-medium hover:underline bg-blue-50 px-3 py-1 rounded-md border border-blue-100 transition-colors"
                                            >
                                                Adjust Monthly
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm no-print">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th rowSpan={2} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider align-middle border-r border-gray-200">Employee</th>
                                    <th rowSpan={2} className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider align-middle border-r border-gray-200">Basic</th>
                                    <th colSpan={3} className="px-4 py-2 text-center text-xs font-bold text-green-700 uppercase tracking-wider border-b border-r border-gray-200 bg-green-50/50">Earnings</th>
                                    <th colSpan={5} className="px-4 py-2 text-center text-xs font-bold text-rose-700 uppercase tracking-wider border-b border-r border-gray-200 bg-rose-50/50">Deductions</th>
                                    <th rowSpan={2} className="px-4 py-3 text-right text-xs font-bold text-gray-800 uppercase tracking-wider align-middle">Net Payout</th>
                                </tr>
                                <tr className="bg-gray-50/50">
                                    <th className="px-3 py-2 text-right text-[10px] font-bold text-green-600 uppercase tracking-wider border-r border-gray-100">Allowances</th>
                                    <th className="px-3 py-2 text-right text-[10px] font-bold text-green-600 uppercase tracking-wider border-r border-gray-100">OT</th>
                                    <th className="px-3 py-2 text-right text-[10px] font-bold text-green-600 uppercase tracking-wider border-r border-gray-200">Bonus</th>

                                    <th className="px-3 py-2 text-right text-[10px] font-bold text-rose-600 uppercase tracking-wider border-r border-gray-100">EPF (EE)</th>
                                    <th className="px-3 py-2 text-right text-[10px] font-bold text-rose-600 uppercase tracking-wider border-r border-gray-100">APIT Tax</th>
                                    <th className="px-3 py-2 text-right text-[10px] font-bold text-rose-600 uppercase tracking-wider border-r border-gray-100">Loans</th>
                                    <th className="px-3 py-2 text-right text-[10px] font-bold text-rose-600 uppercase tracking-wider border-r border-gray-100">Leaves</th>
                                    <th className="px-3 py-2 text-right text-[10px] font-bold text-rose-600 uppercase tracking-wider border-r border-gray-200">Advances</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200 text-xs">
                                {payroll.payslips.map((slip: Payslip) => {
                                    const allowancesTotal = slip.allowances?.reduce((a: number, b: any) => a + Number(b.amount), 0) || 0;
                                    return (
                                        <tr key={slip.id} className="hover:bg-gray-50/55 transition">
                                            <td className="px-4 py-3 font-semibold text-gray-900 border-r border-gray-100">
                                                <div>{slip.staff?.name}</div>
                                                <div className="text-[10px] text-gray-400 font-mono">{slip.staff?.staff_no}</div>
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-gray-700 border-r border-gray-100">{slip.basic_salary.toLocaleString()}</td>

                                            <td className="px-3 py-3 text-right text-green-600 font-semibold border-r border-gray-100">{allowancesTotal > 0 ? allowancesTotal.toLocaleString() : '-'}</td>
                                            <td className="px-3 py-3 text-right text-green-600 font-semibold border-r border-gray-100">{slip.ot_amount > 0 ? slip.ot_amount.toLocaleString() : '-'}</td>
                                            <td className="px-3 py-3 text-right text-green-600 font-bold border-r border-gray-200">{slip.bonus > 0 ? slip.bonus.toLocaleString() : '-'}</td>

                                            <td className="px-3 py-3 text-right text-rose-600 font-semibold border-r border-gray-100">{slip.epf_employee > 0 ? formatLKR(slip.epf_employee) : '-'}</td>
                                            <td className="px-3 py-3 text-right text-rose-600 font-semibold border-r border-gray-100">{slip.income_tax > 0 ? formatLKR(slip.income_tax) : '-'}</td>
                                            <td className="px-3 py-3 text-right text-rose-600 font-semibold border-r border-gray-100">{slip.loan_deduction > 0 ? formatLKR(slip.loan_deduction) : '-'}</td>
                                            <td className="px-3 py-3 text-right text-rose-600 font-semibold border-r border-gray-100">{slip.leave_deduction > 0 ? formatLKR(slip.leave_deduction) : '-'}</td>
                                            <td className="px-3 py-3 text-right text-rose-600 font-bold border-r border-gray-200">{(slip.advance_deduction || 0) > 0 ? formatLKR(slip.advance_deduction || 0) : '-'}</td>

                                            <td className="px-4 py-3 text-right font-black text-gray-900 bg-slate-50/40">{formatLKR(slip.net_salary)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Payslip View & Print Modal */}
            {selectedSlip && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto no-print">
                    <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col my-8">
                        {/* Header Controls */}
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800 text-lg">Payslip Preview</h3>
                            <div className="flex items-center space-x-2">
                                <a
                                    href={`/payslip/${selectedSlip.id}/pdf`}
                                    target="_blank"
                                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-lg shadow-sm transition"
                                >
                                    Open PDF Document
                                </a>
                                <Button
                                    onClick={() => setSelectedSlip(null)}
                                    variant="secondary"
                                >
                                    Close
                                </Button>
                            </div>
                        </div>

                        {/* Printable Area */}
                        <div className="p-8 flex-1 bg-white overflow-y-auto" id="payslip-print-modal">
                            {company?.payslip_html_template ? (
                                <div dangerouslySetInnerHTML={{
                                    __html: (() => {
                                        let rendered = company.payslip_html_template;
                                        const allowancesTotal = selectedSlip.allowances?.reduce((a: number, b: any) => a + Number(b.amount), 0) || 0;
                                        const deductionsTotal = (selectedSlip.deductions?.reduce((a: number, b: any) => a + Number(b.amount), 0) || 0) + (selectedSlip.epf_employee || 0) + (selectedSlip.income_tax || 0) + (selectedSlip.advance_deduction || 0);

                                        const replacements: Record<string, string> = {
                                            '{{company_name}}': company?.name || 'JobAlign',
                                            '{{employee_name}}': selectedSlip.staff?.name || 'N/A',
                                            '{{employee_id}}': selectedSlip.staff?.staff_no || 'N/A',
                                            '{{department}}': selectedSlip.staff?.department?.name || 'N/A',
                                            '{{designation}}': selectedSlip.staff?.designation?.name || 'N/A',
                                            '{{month_year}}': moment().month(payroll.month - 1).format('MMMM') + ' ' + payroll.year,
                                            '{{basic_salary}}': formatLKR(selectedSlip.basic_salary),
                                            '{{ot_amount}}': formatLKR(selectedSlip.ot_amount || 0),
                                            '{{epf_employee}}': formatLKR(selectedSlip.epf_employee || 0),
                                            '{{epf_employer}}': formatLKR(selectedSlip.epf_employer || 0),
                                            '{{etf}}': formatLKR(selectedSlip.etf || 0),
                                            '{{income_tax}}': formatLKR(selectedSlip.income_tax || 0),
                                            '{{bonus}}': formatLKR(selectedSlip.bonus || 0),
                                            '{{loan_deduction}}': formatLKR(selectedSlip.loan_deduction || 0),
                                            '{{leave_deduction}}': formatLKR(selectedSlip.leave_deduction || 0),
                                            '{{advance_deduction}}': formatLKR(selectedSlip.advance_deduction || 0),
                                            '{{net_salary}}': formatLKR(selectedSlip.net_salary),
                                            '{{allowances}}': formatLKR(allowancesTotal),
                                            '{{deductions}}': formatLKR(deductionsTotal),
                                        };

                                        Object.entries(replacements).forEach(([key, val]) => {
                                            rendered = rendered.replaceAll(key, val);
                                        });

                                        return rendered;
                                    })()
                                }} />
                            ) : (
                                <div className="border border-gray-300 p-8 rounded-lg space-y-8 bg-white max-w-3xl mx-auto">
                                    {/* Corporate Payslip Header */}
                                    <div className="flex justify-between items-start border-b pb-6">
                                        <div>
                                            <h2 className="text-2xl font-black tracking-tight text-gray-900">{company?.name || 'JobAlign'}</h2>
                                            <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-bold">Official Payslip</p>
                                        </div>
                                        <div className="text-right text-sm text-gray-600 space-y-1">
                                            <p className="font-bold text-gray-850">Pay Period</p>
                                            <p className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-700 font-semibold">
                                                {moment().month(payroll.month - 1).format('MMMM')} {payroll.year}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Employee Profile info */}
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 bg-gray-50 p-4 rounded-md text-sm">
                                        <div>
                                            <span className="text-gray-500 block text-xs uppercase font-bold tracking-wider">Employee Name</span>
                                            <span className="font-bold text-gray-850 text-base">{selectedSlip.staff?.name}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 block text-xs uppercase font-bold tracking-wider">Employee ID</span>
                                            <span className="font-bold text-gray-850">{selectedSlip.staff?.staff_no}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 block text-xs uppercase font-bold tracking-wider">Department</span>
                                            <span className="font-semibold text-gray-700">{selectedSlip.staff?.department?.name || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 block text-xs uppercase font-bold tracking-wider">Designation</span>
                                            <span className="font-semibold text-gray-700">{selectedSlip.staff?.designation?.name || 'N/A'}</span>
                                        </div>
                                    </div>

                                    {/* Detailed Earnings & Deductions Tables */}
                                    <div className="grid grid-cols-2 gap-8 items-start">
                                        {/* Earnings Section */}
                                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                                            <div className="bg-green-50 px-4 py-2 border-b border-gray-200">
                                                <h4 className="font-bold text-green-900 text-sm">Earnings / Allowances</h4>
                                            </div>
                                            <table className="min-w-full text-sm divide-y divide-gray-100">
                                                <tbody>
                                                    <tr className="bg-gray-50">
                                                        <td className="px-4 py-2 font-semibold text-gray-800">Basic Salary</td>
                                                        <td className="px-4 py-2 text-right font-semibold text-gray-800">{formatLKR(selectedSlip.basic_salary)}</td>
                                                    </tr>
                                                    {selectedSlip.allowances?.map((item: any, i: number) => (
                                                        <tr key={i} className="hover:bg-gray-50">
                                                            <td className="px-4 py-2 text-gray-600">{item.name || item.label || 'Allowance'}</td>
                                                            <td className="px-4 py-2 text-right text-gray-700">{formatLKR(item.amount)}</td>
                                                        </tr>
                                                    ))}
                                                    {selectedSlip.ot_amount ? (
                                                        <tr className="hover:bg-gray-50 bg-green-50/20">
                                                            <td className="px-4 py-2 font-semibold text-green-800">Overtime (OT)</td>
                                                            <td className="px-4 py-2 text-right font-semibold text-green-800">{formatLKR(selectedSlip.ot_amount)}</td>
                                                        </tr>
                                                    ) : null}
                                                    {selectedSlip.bonus ? (
                                                        <tr className="hover:bg-gray-50 bg-green-50/30">
                                                            <td className="px-4 py-2 text-green-800 font-medium">Bonus</td>
                                                            <td className="px-4 py-2 text-right text-green-800 font-semibold">{formatLKR(selectedSlip.bonus)}</td>
                                                        </tr>
                                                    ) : null}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Deductions Section */}
                                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                                            <div className="bg-red-50 px-4 py-2 border-b border-gray-200">
                                                <h4 className="font-bold text-red-900 text-sm">Deductions</h4>
                                            </div>
                                            <table className="min-w-full text-sm divide-y divide-gray-100">
                                                <tbody>
                                                    {selectedSlip.epf_employee ? (
                                                        <tr className="bg-gray-50">
                                                            <td className="px-4 py-2 font-semibold text-gray-800">EPF (Employee {company?.epf_employee_percent || 8}%)</td>
                                                            <td className="px-4 py-2 text-right font-semibold text-red-650">{formatLKR(selectedSlip.epf_employee)}</td>
                                                        </tr>
                                                    ) : null}
                                                    {selectedSlip.income_tax ? (
                                                        <tr className="bg-gray-50">
                                                            <td className="px-4 py-2 font-semibold text-gray-800">Income Tax (APIT)</td>
                                                            <td className="px-4 py-2 text-right font-semibold text-red-650">{formatLKR(selectedSlip.income_tax)}</td>
                                                        </tr>
                                                    ) : null}
                                                    {selectedSlip.deductions?.map((item: any, i: number) => (
                                                        <tr key={i} className="hover:bg-gray-50">
                                                            <td className="px-4 py-2 text-gray-600">{item.name || item.label || 'Deduction'}</td>
                                                            <td className="px-4 py-2 text-right text-red-650">{formatLKR(item.amount)}</td>
                                                        </tr>
                                                    ))}
                                                    {selectedSlip.loan_deduction ? (
                                                        <tr className="hover:bg-gray-50 bg-red-50/20">
                                                            <td className="px-4 py-2 text-red-800 font-medium">Loan Deduction</td>
                                                            <td className="px-4 py-2 text-right text-red-850 font-semibold">{formatLKR(selectedSlip.loan_deduction)}</td>
                                                        </tr>
                                                    ) : null}
                                                    {selectedSlip.leave_deduction ? (
                                                        <tr className="hover:bg-gray-50 bg-red-50/20">
                                                            <td className="px-4 py-2 text-red-800 font-medium">Leave Deduction</td>
                                                            <td className="px-4 py-2 text-right text-red-850 font-semibold">{formatLKR(selectedSlip.leave_deduction)}</td>
                                                        </tr>
                                                    ) : null}
                                                    {selectedSlip.advance_deduction ? (
                                                        <tr className="hover:bg-gray-50 bg-red-50/20">
                                                            <td className="px-4 py-2 text-red-800 font-medium">Advance Recovery</td>
                                                            <td className="px-4 py-2 text-right text-red-850 font-semibold">{formatLKR(selectedSlip.advance_deduction)}</td>
                                                        </tr>
                                                    ) : null}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Employer Contributions Block */}
                                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                                        <div className="px-4 py-2 border-b border-gray-200">
                                            <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider">Employer Statutory Contributions (Not Deducted from Salary)</h4>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 p-4 text-sm">
                                            <div>
                                                <span className="text-gray-500 block text-xs font-semibold">EPF (Employer {company?.epf_employer_percent || 12}%)</span>
                                                <span className="font-bold text-gray-800">{formatLKR(selectedSlip.epf_employer || 0)}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500 block text-xs font-semibold">ETF (Employer {company?.etf_percent || 3}%)</span>
                                                <span className="font-bold text-gray-800">{formatLKR(selectedSlip.etf || 0)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Net Payout Highlight Container */}
                                    <div className="bg-green-600 text-white rounded-lg p-6 flex justify-between items-center shadow-md">
                                        <div>
                                            <span className="text-green-100 text-xs uppercase font-bold tracking-widest block">Net Payout Amount</span>
                                            <span className="text-xs text-green-200 italic mt-1 block">Subject to direct bank deposit</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-2xl font-black tracking-tight">{formatLKR(selectedSlip.net_salary)}</span>
                                        </div>
                                    </div>

                                    {/* Signature and Acknowledgment */}
                                    <div className="grid grid-cols-2 gap-16 pt-8 text-sm">
                                        <div className="text-center border-t border-dashed pt-4">
                                            <p className="font-semibold text-gray-600">Prepared By</p>
                                            <p className="text-xs text-gray-400 mt-1">HR & Payroll Department</p>
                                        </div>
                                        <div className="text-center border-t border-dashed pt-4">
                                            <p className="font-semibold text-gray-600">Employee Acknowledgment</p>
                                            <p className="text-xs text-gray-400 mt-1">Signature & Date</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {editingSlip && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto no-print">
                    <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800 text-lg">Adjust Monthly Payslip</h3>
                            <button
                                onClick={() => setEditingSlip(null)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleSaveAdjustments} className="p-6 space-y-4">
                            <div>
                                <span className="text-sm font-semibold text-gray-700 block mb-1">Employee</span>
                                <div className="text-sm text-gray-900 font-bold bg-gray-100 p-2 rounded-md border border-gray-200">
                                    {editingSlip.staff?.name} ({editingSlip.staff?.staff_no})
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Bonus ({company?.currency_prefix || 'LKR'})</label>
                                <input
                                    type="number"
                                    value={bonus}
                                    onChange={e => setBonus(parseFloat(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 text-sm font-medium"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Loan Deduction ({company?.currency_prefix || 'LKR'})</label>
                                <input
                                    type="number"
                                    value={loanDeduction}
                                    onChange={e => setLoanDeduction(parseFloat(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 text-sm font-medium"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Leave Deduction ({company?.currency_prefix || 'LKR'})</label>
                                <input
                                    type="number"
                                    value={leaveDeduction}
                                    onChange={e => setLeaveDeduction(parseFloat(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 text-sm font-medium"
                                />
                            </div>

                            <div className="flex justify-end space-x-2 pt-4">
                                <Button
                                    variant="secondary"
                                    onClick={() => setEditingSlip(null)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                >
                                    Save Adjustments
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PayrollPayslipsPage;
