import { router, usePage, Head } from '@inertiajs/react';
import { useDateFormat, formatDate } from '@/Utils/dateFormat';
import { getEditRoute } from '@/Utils/routeUtils';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CommonButton from '@/Components/CommonButton';

const typeLabel = (type = '') => {
    return String(type || '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
};



export default function TransactionHistoryPage() {
    const { records = [], transactionType = 'invoice' } = usePage().props;
    const dateFormat = useDateFormat();
    const title = `${typeLabel(transactionType)} History`;

    return (
        <AuthenticatedLayout header={title}>
            <Head title={title} />
            <div className="mx-auto flex max-w-5xl flex-col px-6 py-8">
                <div className="mb-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">History</p>
                        <h1 className="text-lg font-semibold text-slate-800">{typeLabel(transactionType)} history</h1>
                    </div>
                    <CommonButton
                        type="button"
                        onClick={() => window.history.back()}
                        variant="secondary"
                    >
                        Back
                    </CommonButton>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-4 py-3 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                        All records
                    </div>
                    <div className="max-h-[70vh] overflow-y-auto p-0 text-[11px] text-slate-700">
                        {records.length === 0 ? (
                            <div className="px-3 py-8 text-center text-[10px] uppercase tracking-[0.25em] text-slate-400">No history found</div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 z-10">
                                    <tr>
                                        <th className="py-2.5 px-4 font-semibold text-slate-600 w-[12%]">Date</th>
                                        <th className="py-2.5 px-4 font-semibold text-slate-600 w-[12%]">Ref No.</th>
                                        <th className="py-2.5 px-4 font-semibold text-slate-600 w-[20%]">Payee / Account</th>
                                        <th className="py-2.5 px-4 font-semibold text-slate-600 w-[24%]">Memo</th>
                                        <th className="py-2.5 px-4 font-semibold text-slate-600 text-right w-[12%]">Debit</th>
                                        <th className="py-2.5 px-4 font-semibold text-slate-600 text-right w-[12%]">Credit</th>
                                        <th className="py-2.5 px-4 w-[8%]"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {records.map((record) => {
                                        const isVoided = record.status === 'void';
                                        return (
                                        <tr key={record.id} className={`transition-colors group ${isVoided ? 'bg-slate-50/60 opacity-60' : 'hover:bg-slate-50/50'}`}>
                                            <td className="px-4 py-3 text-slate-600 font-mono">
                                                {formatDate(record.date, dateFormat) || '—'}
                                            </td>
                                            <td className="px-4 py-3 font-bold text-slate-800 font-mono">
                                                <div className="flex items-center gap-1.5">
                                                    <span>{record.ref_no || record.id}</span>
                                                    {isVoided && (
                                                        <span className="rounded bg-rose-100 px-1.5 py-0.2 text-[9px] font-bold text-rose-700 uppercase tracking-wider">
                                                            Void
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-slate-800 font-bold">
                                                {record.payee_account || '—'}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate" title={record.memo}>
                                                {record.memo || '—'}
                                            </td>
                                            <td className="px-4 py-3 font-bold text-slate-900 text-right font-mono">
                                                {record.debit > 0 ? parseFloat(record.debit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                            </td>
                                            <td className="px-4 py-3 font-bold text-slate-900 text-right font-mono">
                                                {record.credit > 0 ? parseFloat(record.credit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <CommonButton
                                                    type="button"
                                                    onClick={() => router.visit(route(getEditRoute(transactionType), record.id))}
                                                    variant="secondary"
                                                    size="xs"
                                                >
                                                    View
                                                </CommonButton>
                                            </td>
                                        </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
