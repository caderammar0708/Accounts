import { useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';

const TYPE_MAP = {
    "sales invoice": 'sales_invoice',
    'credit invoice': 'credit_invoice',
    'return invoice': 'return_invoice',
    'receive payment': 'receive_payment',

    'payment': 'payment',
    'bill': 'bill',
    'pay bill': 'pay_bill',
    'bill return': 'bill_return',

    'bank deposit': 'bank_deposit',
    'transfer': 'transfer',
    'journal entry': 'journal_entry',
    'inventory qty adj': 'inventory_adjustment',
    'inventory adjustment': 'inventory_adjustment',
};

const normalizeType = (type = '') => {
    const key = String(type || '').toLowerCase().replace(/[_-]+/g, ' ').trim();
    return TYPE_MAP[key] || key || 'invoice';
};

const getEditRoute = (type) => {
    switch (type) {
        case 'pos':
            return 'pos.edit';
        case 'credit_invoice':
            return 'credit-invoice.edit';
        case 'bill':
            return 'bill.edit';
        case 'payment':
            return 'payment.edit';
        case 'receive_payment':
            return 'receive-payment.edit';
        case 'pay_bill':
            return 'pay-bill.edit';
        case 'bank_deposit':
            return 'bank-deposit.edit';
        case 'bill_return':
            return 'bill-return.edit';
        case 'invoice_return':
            return 'invoice-return.edit';
        case 'sales_invoice':
            return 'sales-invoice.edit';
        case 'transfer':
            return 'transfer.edit';
        case 'cheque_deposit':
            return 'cheque-deposit.edit';
        case 'cheque':
            return 'cheque.edit';
        case 'inventory_quantity_adjustment':
        case 'inventory_adjustment':
            return 'inventory-adjustment.edit';
        default:
            return 'journal-entries.edit';
    }
};

export default function RecentTransactionHistory({ historyType = 'invoice', dirty = false, children }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [cache, setCache] = useState({});
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pendingTarget, setPendingTarget] = useState(null);

    const normalizedType = useMemo(() => normalizeType(historyType), [historyType]);
    const records = cache[normalizedType] || [];

    const loadRecords = async () => {
        if (!normalizedType) return;

        setLoading(true);
        try {
            const { data } = await axios.get(route('api.history', { transactionType: normalizedType }), {
                params: { limit: 5 },
            });
            setCache((prev) => ({ ...prev, [normalizedType]: Array.isArray(data) ? data : [] }));
        } catch (error) {
            console.error('Failed to load history records', error);
            setCache((prev) => ({ ...prev, [normalizedType]: [] }));
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async () => {
        const nextOpen = !open;
        setOpen(nextOpen);
        if (nextOpen) {
            await loadRecords();
        }
    };

    const handleOpenRecord = (record) => {
        const target = route(getEditRoute(normalizedType), record.id);

        if (dirty) {
            setPendingTarget(target);
            setConfirmOpen(true);
            return;
        }

        router.visit(target, { replace: true });
        setOpen(false);
    };

    const confirmNavigation = () => {
        if (pendingTarget) {
            router.visit(pendingTarget, { replace: true });
        }
        setConfirmOpen(false);
        setOpen(false);
    };

    return (
        <div className="relative">
            {children ? (
                <div onClick={handleToggle} className="cursor-pointer" aria-label="Recent transaction history">
                    {children}
                </div>
            ) : (
                <button
                    type="button"
                    onClick={handleToggle}
                    tabIndex={-1}
                    className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition hover:border-primary-500 hover:bg-primary-50 hover:text-primary-700"
                    aria-label="Recent transaction history"
                >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </button>
            )}

            {open && (
                <div className="absolute left-0 top-11 z-50 w-[340px] rounded-xl border border-slate-200 bg-white shadow-xl ring-1 ring-black/5">
                    <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Recent records</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                            aria-label="Close history panel"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="max-h-[260px] overflow-y-auto p-2 text-[11px] text-slate-700">
                        {loading ? (
                            <div className="px-2 py-4 text-center text-[10px] uppercase tracking-[0.2em] text-slate-400">Loading…</div>
                        ) : records.length === 0 ? (
                            <div className="px-2 py-4 text-center text-[10px] uppercase tracking-[0.2em] text-slate-400">No recent records</div>
                        ) : (
                            <>
                                {records.map((record) => (
                                    <button
                                        key={record.id}
                                        type="button"
                                        onClick={() => handleOpenRecord(record)}
                                        className="mb-1 block w-full rounded-md px-2 py-1.5 text-left text-[11px] text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:bg-slate-100"
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex flex-col overflow-hidden">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-semibold text-slate-800">{record.date || '—'}</span>
                                                    {record.status === 'void' && (
                                                        <span className="rounded bg-rose-100 px-1 py-0.2 text-[8px] font-bold text-rose-700 uppercase">
                                                            Void
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-slate-500 truncate" title={record.memo}>{record.memo || '—'}</span>
                                            </div>
                                            <span className={`font-bold whitespace-nowrap ${record.status === 'void' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                                {parseFloat(record.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                                <div className="mt-2 border-t border-slate-100 pt-2 text-center">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            router.visit(route('history.index', { transactionType: normalizedType }), { replace: true });
                                            setOpen(false);
                                        }}
                                        className="text-[10px] font-black uppercase tracking-[0.25em] text-primary-600 hover:text-primary-700"
                                    >
                                        More...
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {confirmOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/35 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-black/5">
                        <p className="text-sm font-semibold text-slate-800">Unsaved changes will be lost. Continue?</p>
                        <p className="mt-2 text-xs text-slate-500">This transaction has unsaved changes. Opening another record will discard them.</p>
                        <div className="mt-5 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setConfirmOpen(false)}
                                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-600 hover:bg-slate-100"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmNavigation}
                                className="rounded-xl bg-primary-600 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white hover:bg-primary-700"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
