import React from 'react';
import { Link, usePage, Head, router as Inertia, Page } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CommonButton from '@/Components/CommonButton';
import { PageProps, Payroll } from '@/src/types';
import Pagination from '@/src/components/ui/Pagination';
import moment from 'moment';

const PayrollIndexPage: React.FC = () => {
    const { payrolls, company, auth } = usePage<Page<PageProps>>().props as any;

    const prefix = company?.currency_prefix || auth?.currency?.prefix || 'LKR';

    return (
        <AuthenticatedLayout
            user={auth?.user || {}}
            header={<h2 className="font-bold text-lg text-slate-800 tracking-tight">Payroll Management</h2>}
        >
            <Head title="Payroll Management" />

            <div className="p-6 max-w-7xl mx-auto space-y-6">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-sm font-bold text-slate-800 tracking-tight">Historical Payroll Cycles</h3>
                            <p className="text-xs text-slate-500 mt-0.5">View active payroll status, cumulative net payout, and manage staff pay cycles.</p>
                        </div>
                        <CommonButton
                            variant="primary"
                            href="/payroll/create"
                        >
                            + Generate Payroll
                        </CommonButton>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Period</th>
                                    <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Total Net Amount ({prefix})</th>
                                    <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Status</th>
                                    <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                                {payrolls.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-xs font-medium">
                                            No payroll cycles created yet. Click "+ Generate Payroll" to get started.
                                        </td>
                                    </tr>
                                ) : (
                                    payrolls.data.map((p: Payroll) => (
                                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-3.5 whitespace-nowrap text-xs font-bold text-slate-900">
                                                {moment().month(p.month - 1).format('MMMM')} {p.year}
                                            </td>
                                            <td className="px-6 py-3.5 whitespace-nowrap text-xs font-mono font-bold text-slate-800 text-right">
                                                {prefix} {p.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-3.5 whitespace-nowrap text-center">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 text-2xs font-bold rounded-full ${
                                                    p.status === 'Paid' 
                                                        ? 'bg-green-50 text-primary border border-green-200' 
                                                        : p.status === 'Processed' 
                                                            ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                                                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                                                }`}>
                                                    {p.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3.5 whitespace-nowrap text-right text-xs font-medium space-x-2">
                                                <Link 
                                                    href={`/payroll/${p.id}`} 
                                                    className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold text-slate-600 hover:text-primary hover:bg-slate-50 border border-slate-200 transition-colors"
                                                >
                                                    View Payslips
                                                </Link>
                                                {p.status !== 'Paid' && (
                                                    <CommonButton 
                                                        size="xs"
                                                        variant="secondary"
                                                        onClick={() => Inertia.post(`/payroll/${p.id}/pay`)} 
                                                    >
                                                        Mark Paid
                                                    </CommonButton>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="border-t border-slate-100 p-4 bg-slate-50/30">
                        <Pagination
                            currentPage={payrolls.current_page}
                            totalPages={payrolls.last_page}
                            onPageChange={pg => Inertia.get('/payroll', { page: pg }, { preserveState: true })}
                            totalItems={payrolls.total}
                            itemsPerPage={payrolls.per_page}
                        />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default PayrollIndexPage;
