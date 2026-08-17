import ReportLayout from '@/Layouts/ReportLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useMemo, useState, useEffect, Fragment } from 'react';
import CommonButton from '@/Components/CommonButton';
import CommonInput from '@/Components/CommonInput';

import ReportDateFilter from '@/Components/ReportDateFilter';
import { useDateFormat, formatDate } from '@/Utils/dateFormat';
import axios from 'axios';

export default function AccountHistory({ account, lines = [], accounts = [], filters = {} }) {
    const { auth } = usePage().props;
    const currencyPrefix = account.currency || auth.company?.home_currency_prefix || auth.company?.home_currency || '';
    const dateFormat = useDateFormat();

    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');

    const handleRunReport = (overrideStart, overrideEnd) => {
        const s = typeof overrideStart === 'string' ? overrideStart : startDate;
        const e = typeof overrideEnd === 'string' ? overrideEnd : endDate;
        router.get(route('chart-of-account.history', account.id), { start_date: s, end_date: e }, {
            preserveState: true,
            preserveScroll: true,
        });
    };
    // Calculate running balance
    const transactions = useMemo(() => {
        let currentBalance = 0;
        // The lines are already ordered by date desc in the controller.
        // For running balance, we need them ordered by date asc.
        const sortedLines = [...lines].reverse();

        return sortedLines.map(line => {
            const debit = parseFloat(line.debit || 0);
            const credit = parseFloat(line.credit || 0);

            // Asset/Expense: Debit increases, Credit decreases
            // Liability/Equity/Income: Credit increases, Debit decreases
            const isNormalDebit = ['asset', 'expense'].includes(account.account_type);

            if (isNormalDebit) {
                currentBalance += (debit - credit);
            } else {
                currentBalance += (credit - debit);
            }

            return {
                ...line,
                running_balance: currentBalance
            };
        }).reverse(); // Reverse back to show newest first in the table
    }, [account, lines]);

    const isNormalDebit = ['asset', 'expense'].includes(account.account_type);

    // Fetch payees list
    const [payees, setPayees] = useState([]);
    useEffect(() => {
        axios.get(route('api.payees'))
            .then(res => {
                if (Array.isArray(res.data)) {
                    setPayees(res.data);
                }
            })
            .catch(err => console.error("Failed to load payees:", err));
    }, []);

    // Inline edit states
    const [editingTxId, setEditingTxId] = useState(null);
    const [editForm, setEditForm] = useState({
        date: '',
        reference: '',
        payee_id: '',
        offset_account_id: '',
        memo: '',
        debit: '0.00',
        credit: '0.00'
    });

    const getOffsetAccount = (tx) => {
        const linesList = tx.journal_entry?.lines || [];
        if (linesList.length === 2) {
            const offsetLine = linesList.find(l => l.chart_of_acc_id !== account.id);
            return offsetLine?.account ? `${offsetLine.account.account_code} - ${offsetLine.account.name}` : 'Unknown';
        } else if (linesList.length > 2) {
            return 'Split';
        }
        return '-';
    };

    const getOffsetAccountId = (tx) => {
        const linesList = tx.journal_entry?.lines || [];
        if (linesList.length === 2) {
            const offsetLine = linesList.find(l => l.chart_of_acc_id !== account.id);
            return offsetLine?.chart_of_acc_id || '';
        }
        return '';
    };

    const getPayeeLabel = (payeeId) => {
        if (!payeeId) return '-';
        const payee = payees.find(p => p.value === payeeId);
        return payee ? payee.label : '-';
    };

    const getEditRoute = (tx) => {
        const type = tx.journal_entry?.transaction_type;
        const id = tx.journal_entry_id;
        const transactionable_id = tx.journal_entry?.transactionable_id;

        switch (type) {
            case 'pos':
                return route('pos.edit', id);
            case 'shift_settlement':
                return route('shifts.collections.edit', transactionable_id || id);
            case 'credit_invoice':
                if (tx.journal_entry?.transactionable?.source_type === 'App\\Models\\FuelStation\\PumpShift') {
                    return route('shifts.collections.edit', tx.journal_entry.transactionable.source_id);
                }
                return route('credit-invoice.edit', id);
            case 'sales_invoice':
                if (tx.journal_entry?.transactionable?.pump_shift_id) {
                    return route('shifts.collections.edit', tx.journal_entry.transactionable.pump_shift_id);
                }
                return route('sales-invoice.edit', id);
            case 'bill':
                return route('bill.edit', id);
            case 'payment': 
                return route('payment.edit', id);
            case 'receive_payment':
                return route('receive-payment.edit', id);
            case 'pay_bill':
                return route('pay-bill.edit', id);
            case 'bank_deposit':
                return route('bank-deposit.edit', id);
            case 'bill_return':
                return route('bill-return.edit', id);
            case 'invoice_return':
                return route('invoice-return.edit', id);
            case 'transfer':
                return route('transfer.edit', id);
            case 'cheque_deposit':
                return route('cheque-deposit.edit', id);
            case 'cheque':
                return route('cheque.edit', id);
            case 'inventory_quantity_adjustment':
            case 'inventory_adjustment':
                return route('inventory-adjustment.edit', id);
            default:
                return route('journal-entries.edit', id);
        }
    };

    const handleStartEdit = (tx) => {
        const offsetAccountId = getOffsetAccountId(tx);
        setEditingTxId(tx.id);
        setEditForm({
            date: tx.journal_entry?.date || '',
            reference: tx.journal_entry?.reference || '',
            payee_id: tx.payee_id || tx.journal_entry?.payee_id || '',
            offset_account_id: offsetAccountId,
            memo: tx.memo || tx.journal_entry?.description || '',
            debit: parseFloat(tx.debit || 0).toFixed(2),
            credit: parseFloat(tx.credit || 0).toFixed(2)
        });
    };

    const handleSaveEdit = (txId, journalEntryId) => {
        const payload = {
            date: editForm.date,
            reference: editForm.reference,
            description: editForm.memo,
            chart_of_acc_id: account.id,
            offset_account_id: editForm.offset_account_id,
            debit: parseFloat(String(editForm.debit).replace(/,/g, '')) || 0,
            credit: parseFloat(String(editForm.credit).replace(/,/g, '')) || 0,
            payee_id: editForm.payee_id || null
        };

        axios.post(route('journal-entries.quick-update', journalEntryId), payload)
            .then(res => {
                setEditingTxId(null);
                router.reload();
            })
            .catch(err => {
                console.error("Failed to update transaction:", err);
                alert("Failed to save transaction: " + (err.response?.data?.message || err.message));
            });
    };

    const handleDeleteTx = (journalEntryId) => {
        if (confirm("Are you sure you want to delete this transaction? This will delete the entire journal entry and cannot be undone.")) {
            router.delete(route('journal-entries.destroy', journalEntryId), {
                onSuccess: () => {
                    setEditingTxId(null);
                },
                onError: (errors) => {
                    console.error("Failed to delete transaction:", errors);
                    alert("Failed to delete the transaction.");
                },
            });
        }
    };

    const handleExportExcel = () => {
        const companyName = auth.company?.company_name || 'Company';

        let csvContent = "";

        // Add Title Header
        csvContent += `"${companyName}"\n`;
        csvContent += `"Account History: ${account.name}"\n`;
        if (filters.start_date && filters.end_date) {
            csvContent += `"${formatDate(filters.start_date, dateFormat)} - ${formatDate(filters.end_date, dateFormat)}"\n\n`;
        } else {
            csvContent += `"All Dates"\n\n`;
        }

        // Headers
        csvContent += `"Date","Ref No.","Payee / Account","Memo","Debit","Credit","Balance"\n`;

        // Transactions
        transactions.forEach(tx => {
            const date = tx.journal_entry?.date || '';
            const ref = tx.journal_entry?.reference || '';

            const payeeLabel = getPayeeLabel(tx.payee_id || tx.journal_entry?.payee_id);
            const offsetAccount = getOffsetAccount(tx);
            const payeeAccountStr = `${payeeLabel !== '-' ? payeeLabel + ' / ' : ''}${offsetAccount}`;

            const desc = tx.journal_entry?.description || '';
            const memo = tx.memo ? ` - ${tx.memo}` : '';
            const memoStr = `${desc}${memo}`;

            const debit = parseFloat(tx.debit) > 0 ? parseFloat(tx.debit).toFixed(2) : '';
            const credit = parseFloat(tx.credit) > 0 ? parseFloat(tx.credit).toFixed(2) : '';
            const balance = parseFloat(tx.running_balance).toFixed(2);

            csvContent += `"${date}","${ref}","${payeeAccountStr.replace(/"/g, '""')}","${memoStr.replace(/"/g, '""')}",${debit},${credit},${balance}\n`;
        });

        // Create download blob
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${companyName.replace(/[^a-z0-9]/gi, '_')}_Account_History_${account.name.replace(/[^a-z0-9]/gi, '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filterElements = (
        <ReportDateFilter
            currentFilter={{ start_date: filters.start_date || '', end_date: filters.end_date || '', type: filters.type || 'custom' }}
            onFilterChange={({ start_date: newStart, end_date: newEnd }) => {
                setStartDate(newStart);
                setEndDate(newEnd);
                handleRunReport(newStart, newEnd);
            }}
        />
    );

    return (
        <ReportLayout
            title={`Account History: ${account.name}`}
            filters={filterElements}
            onExportExcel={handleExportExcel}
        >
            <Head title={`History - ${account.name}`} />

            <div className="text-center mb-8 font-serif relative">
                <h2 className="text-xl font-bold text-gray-900">Account History: {account.name}</h2>
                <h3 className="text-sm text-gray-700 mt-1">{auth.company?.company_name}</h3>
                <p className="text-[13px] text-gray-500 mt-1">
                    {account.account_code} • {account.account_type}
                </p>
                {filters.start_date && filters.end_date && (
                    <p className="text-[13px] text-gray-500 mt-1">
                        {formatDate(filters.start_date, dateFormat)} - {formatDate(filters.end_date, dateFormat)}
                    </p>
                )}
            </div>

            <div className="w-full overflow-x-auto pb-10" style={{ minWidth: 0 }}>
                <table className="w-full max-w-full text-[13px] text-left border-collapse table-fixed" style={{ minWidth: 0, tableLayout: 'fixed' }}>
                    <thead>
                        <tr className="border-y-2 border-gray-300">
                            <th className="py-2.5 px-3 font-semibold text-gray-900 break-words">Date</th>
                            <th className="py-2.5 px-3 font-semibold text-gray-900 break-words">Ref No.</th>
                            <th className="py-2.5 px-3 font-semibold text-gray-900 break-words">Payee / Account</th>
                            <th className="py-2.5 px-3 font-semibold text-gray-900 break-words">Memo</th>
                            <th className="py-2.5 px-3 font-semibold text-gray-900 text-right break-words">Debit</th>
                            <th className="py-2.5 px-3 font-semibold text-gray-900 text-right break-words">Credit</th>
                            <th className="py-2.5 px-3 font-semibold text-gray-900 text-right break-words">Balance</th>
                            <th className="py-2.5 px-3 font-semibold text-gray-900 text-center break-words"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {transactions.map((tx) => {
                            const isEditing = editingTxId === tx.id;
                            const isSplit = (tx.journal_entry?.lines || []).length > 2;

                            // Determine the split account label dynamically
                            const selectedOffsetAccount = accounts.find(a => a.id === editForm.offset_account_id);
                            const offsetAccountTypeLabel = selectedOffsetAccount
                                ? (selectedOffsetAccount.account_type.charAt(0).toUpperCase() + selectedOffsetAccount.account_type.slice(1))
                                : 'Account';

                            if (isEditing) {
                                return (
                                    <Fragment key={tx.id}>
                                        {/* Editing Row */}
                                        <tr className="bg-primary-50/20 hover:bg-primary-50/30 transition-colors">
                                            {/* Date */}
                                            <td className="px-2 py-4 align-top">
                                                <input
                                                    type="date"
                                                    value={editForm.date}
                                                    onChange={e => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                                                    className="w-full px-2 py-1 border border-slate-300 rounded text-[11px] focus:ring-1 focus:ring-green-500 focus:border-green-500"
                                                />
                                            </td>
                                            {/* Ref No */}
                                            <td className="px-2 py-4 align-top">
                                                <input
                                                    type="text"
                                                    value={editForm.reference}
                                                    onChange={e => setEditForm(prev => ({ ...prev, reference: e.target.value }))}
                                                    placeholder="Ref No."
                                                    className="w-full px-2 py-1 border border-slate-300 rounded text-[11px] focus:ring-1 focus:ring-green-500 focus:border-green-500"
                                                />
                                            </td>
                                            {/* Payee / Account */}
                                            <td className="px-2 py-4 align-top space-y-2">
                                                <div>
                                                    <select
                                                        value={editForm.payee_id}
                                                        onChange={e => setEditForm(prev => ({ ...prev, payee_id: e.target.value }))}
                                                        className="w-full px-2 py-1 border border-slate-300 rounded text-[11px] focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-white"
                                                    >
                                                        <option value="">Payee</option>
                                                        {payees.map(p => (
                                                            <option key={p.value} value={p.value}>{p.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-bold text-slate-400 w-16 uppercase shrink-0">{offsetAccountTypeLabel}</span>
                                                    {isSplit ? (
                                                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">-Split-</span>
                                                    ) : (
                                                        <select
                                                            value={editForm.offset_account_id}
                                                            onChange={e => setEditForm(prev => ({ ...prev, offset_account_id: e.target.value }))}
                                                            className="w-full px-2 py-1 border border-slate-300 rounded text-[11px] focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-white"
                                                        >
                                                            <option value="">Select Account</option>
                                                            {accounts.map(a => (
                                                                <option key={a.id} value={a.id}>{a.account_code} - {a.name}</option>
                                                            ))}
                                                        </select>
                                                    )}
                                                </div>
                                            </td>
                                            {/* Description */}
                                            <td className="px-2 py-4 align-top">
                                                <textarea
                                                    value={editForm.memo}
                                                    onChange={e => setEditForm(prev => ({ ...prev, memo: e.target.value }))}
                                                    rows="2"
                                                    className="w-full px-2 py-1 border border-slate-300 rounded text-[11px] leading-snug focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-white resize-none"
                                                />
                                            </td>
                                            {/* Amount 1 (Debit) */}
                                            <td className="px-2 py-4 align-top">
                                                {(parseFloat(tx.debit) > 0 || (parseFloat(tx.debit) === 0 && parseFloat(tx.credit) === 0 && isNormalDebit)) ? (
                                                    <div className="space-y-1">
                                                        <input
                                                            type="text"
                                                            value={editForm.debit}
                                                            onChange={e => {
                                                                const val = e.target.value.replace(/[^\d.]/g, '');
                                                                setEditForm(prev => ({ ...prev, debit: val }));
                                                            }}
                                                            className="w-full px-2 py-1 border border-slate-300 rounded text-[11px] focus:ring-1 focus:ring-green-500 focus:border-green-500 text-right font-mono"
                                                        />
                                                        <span className="text-[9px] font-bold text-slate-400 block text-right italic uppercase">{isNormalDebit ? 'Deposit' : 'Expense'}</span>
                                                    </div>
                                                ) : (
                                                    <div className="text-right text-slate-400 py-1">-</div>
                                                )}
                                            </td>
                                            {/* Amount 2 (Credit) */}
                                            <td className="px-2 py-4 align-top">
                                                {(parseFloat(tx.credit) > 0 || (parseFloat(tx.debit) === 0 && parseFloat(tx.credit) === 0 && !isNormalDebit)) ? (
                                                    <div className="space-y-1">
                                                        <input
                                                            type="text"
                                                            value={editForm.credit}
                                                            onChange={e => {
                                                                const val = e.target.value.replace(/[^\d.]/g, '');
                                                                setEditForm(prev => ({ ...prev, credit: val }));
                                                            }}
                                                            className="w-full px-2 py-1 border border-slate-300 rounded text-[11px] focus:ring-1 focus:ring-green-500 focus:border-green-500 text-right font-mono"
                                                        />
                                                        <span className="text-[9px] font-bold text-slate-400 block text-right italic uppercase">{isNormalDebit ? 'Expense' : 'Deposit'}</span>
                                                    </div>
                                                ) : (
                                                    <div className="text-right text-slate-400 py-1">-</div>
                                                )}
                                            </td>
                                            {/* Balance */}
                                            <td className="px-4 py-4 align-top text-right text-[11px] font-bold text-slate-500 font-mono">
                                                {tx.running_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                            {/* Empty Actions cell */}
                                            <td className="px-4 py-4 align-top"></td>
                                        </tr>
                                        {/* Bottom Actions Bar Row */}
                                        <tr className="bg-primary-50/30">
                                            <td colSpan="8" className="px-4 py-2.5 text-right space-x-2 border-b border-slate-200">
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteTx(tx.journal_entry_id)}
                                                    className="px-4 py-1.5 bg-white border border-slate-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200 rounded-xl text-xs font-bold text-slate-600 transition-all shadow-sm"
                                                >
                                                    Delete
                                                </button>
                                                <Link
                                                    href={getEditRoute(tx)}
                                                    className="px-4 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 transition-all shadow-sm inline-block"
                                                >
                                                    Edit
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => setEditingTxId(null)}
                                                    className="px-4 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 transition-all shadow-sm"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleSaveEdit(tx.id, tx.journal_entry_id)}
                                                    className="px-5 py-1.5 bg-green-700 hover:bg-green-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                                                >
                                                    Save
                                                </button>
                                            </td>
                                        </tr>
                                    </Fragment>
                                );
                            }

                            return (
                                <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                                    {/* Date */}
                                    <td className="px-4 py-3 text-[11px] text-slate-600 font-mono">
                                        {tx.journal_entry?.date}
                                    </td>
                                    {/* Ref No */}
                                    <td className="px-4 py-3 text-[11px] font-bold text-slate-800 font-mono">
                                        {tx.journal_entry?.reference || '-'}
                                    </td>
                                    {/* Payee / Account */}
                                    <td className="px-4 py-3 text-[11px] text-slate-600">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-800">{getPayeeLabel(tx.payee_id || tx.journal_entry?.payee_id)}</span>
                                            <span className={`text-[10px] font-semibold mt-0.5 ${isSplit ? 'text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded w-max' : 'text-slate-400'}`}>
                                                {getOffsetAccount(tx)}
                                            </span>
                                        </div>
                                    </td>
                                    {/* Memo / Description */}
                                    <td className="px-4 py-3 text-[11px] text-slate-600">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-700">{tx.journal_entry?.description}</span>
                                            {tx.memo && <span className="text-[10px] text-slate-400 italic mt-0.5">{tx.memo}</span>}
                                        </div>
                                    </td>
                                    {/* Debit Amount */}
                                    <td className="px-4 py-3 text-[11px] font-bold text-slate-900 text-right font-mono">
                                        {parseFloat(tx.debit) > 0 ? parseFloat(tx.debit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                    </td>
                                    {/* Credit Amount */}
                                    <td className="px-4 py-3 text-[11px] font-bold text-slate-900 text-right font-mono">
                                        {parseFloat(tx.credit) > 0 ? parseFloat(tx.credit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                    </td>
                                    {/* Balance */}
                                    <td className="px-4 py-3 text-[11px] font-bold text-primary-600 text-right font-mono">
                                        {currencyPrefix} {tx.running_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    {/* Action */}
                                    <td className="px-4 py-3 text-center">
                                        <CommonButton
                                            variant="ghost"
                                            size="xs"
                                            href={getEditRoute(tx)}
                                            className="whitespace-nowrap"
                                        >
                                            View/Edit
                                        </CommonButton>
                                    </td>
                                </tr>
                            );
                        })}
                        {transactions.length === 0 && (
                            <tr>
                                <td colSpan={8} className="px-4 py-12 text-center text-[11px] text-slate-400 font-medium">
                                    No transactions found for this account.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </ReportLayout>
    );
}
