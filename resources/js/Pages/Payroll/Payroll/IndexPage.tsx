import React, { useEffect, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { usePageHeader } from '@/src/App';
import { PageProps, Payroll } from '@/src/types';
import { PlusIcon, EyeIcon } from '@/src/components/icons/Icons';
import { router as Inertia, Page } from '@inertiajs/react';
import Pagination from '@/src/components/ui/Pagination';
import moment from 'moment';

const PayrollIndexPage: React.FC = () => {
    const { payrolls, company } = usePage<Page<PageProps>>().props as any;
    const { setTitle, setActions } = usePageHeader();

    useEffect(() => {
        setTitle('Payroll Management');
    }, [setTitle]);

    const prefix = company?.currency_prefix || 'LKR';

    return (
        <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                <div>
                    <h3 className="text-base font-bold text-white tracking-wide">Historical Payroll Cycles</h3>
                    <p className="text-slate-400 text-xs mt-0.5">View active payroll status, cumulative net payout, and manage staff pay cycles.</p>
                </div>
                <Link href="/payroll/create" className="flex items-center justify-center px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 rounded-lg shadow-sm transition duration-150 gap-2">
                    <PlusIcon className="h-4 w-4" />
                    Generate Payroll
                </Link>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Period</th>
                            <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Total Net Amount ({prefix})</th>
                            <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                        {payrolls.data.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-400 italic">No payroll cycles created yet. Click "Generate Payroll" to get started.</td>
                            </tr>
                        ) : (
                            payrolls.data.map((p: Payroll) => (
                                <tr key={p.id} className="hover:bg-slate-50/50 transition">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                                        {moment().month(p.month - 1).format('MMMM')} {p.year}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-800">
                                        {prefix} {p.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full 
                                            ${p.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                                                p.status === 'Processed' ? 'bg-teal-100 text-teal-800' :
                                                    'bg-slate-100 text-slate-800'}`}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold space-x-3">
                                        <Link href={`/payroll/${p.id}`} className="text-teal-600 hover:text-teal-800 transition inline-flex items-center gap-1.5">
                                            <EyeIcon className="h-4 w-4 inline" /> View Payslips
                                        </Link>
                                        {p.status !== 'Paid' && (
                                            <button 
                                                onClick={() => Inertia.post(`/payroll/${p.id}/pay`)} 
                                                className="px-3 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded text-xs transition font-bold"
                                            >
                                                Mark Paid
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <div className="border-t border-slate-100 p-4 bg-slate-50/50">
                <Pagination
                    currentPage={payrolls.current_page}
                    totalPages={payrolls.last_page}
                    onPageChange={pg => Inertia.get('/payroll', { page: pg }, { preserveState: true })}
                    totalItems={payrolls.total}
                    itemsPerPage={payrolls.per_page}
                />
            </div>
        </div>
    );
};

export default PayrollIndexPage;
