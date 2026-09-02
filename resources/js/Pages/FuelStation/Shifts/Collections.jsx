import React, { useEffect, useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CommonButton from '@/Components/CommonButton';
import CommonInput from '@/Components/CommonInput';
import SearchableSelect from '@/Components/SearchableSelect';
import dayjs from 'dayjs';
import { DEFAULT_CURRENCY } from '@/Utils/Constants';

export default function Collections({ shift, accounts, customers }) {

    const { data, setData, post, processing, errors, transform } = useForm({
        collections: shift.collections?.length > 0 ? shift.collections.map(c => ({
            chart_of_acc_id: c.chart_of_acc_id,
            description: c.description || "",
            amount: parseFloat(c.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })
        })) : [
            { chart_of_acc_id: '', description: '', amount: '0.00' }
        ],
        credit_sales: shift.credit_sales && shift.credit_sales.length > 0 ? shift.credit_sales.map(cs => ({
            ...cs,
            amount: cs.amount ? parseFloat(cs.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''
        })) : [{ customer_id: '', description: '', amount: '' }],
        receive_payments: shift.receive_payments && shift.receive_payments.length > 0 ? shift.receive_payments.map(rp => ({
            ...rp,
            amount: rp.amount ? parseFloat(rp.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''
        })) : [{ customer_id: '', description: '', amount: '' }]
    });

    transform((data) => {
        const cleanVal = (v) => parseFloat(String(v || 0).replace(/,/g, '')) || 0;
        return {
            ...data,
            collections: data.collections
                .filter(c => c.chart_of_acc_id || cleanVal(c.amount) !== 0 || (c.description && c.description.trim() !== ''))
                .map(c => ({
                    ...c,
                    amount: c.amount ? String(c.amount).replace(/,/g, '') : ''
                })),
            credit_sales: data.credit_sales
                .filter(cs => cs.customer_id || cleanVal(cs.amount) !== 0 || (cs.description && cs.description.trim() !== ''))
                .map(cs => ({
                    ...cs,
                    amount: cs.amount ? String(cs.amount).replace(/,/g, '') : ''
                })),
            receive_payments: data.receive_payments
                .filter(rp => rp.customer_id || cleanVal(rp.amount) !== 0 || (rp.description && rp.description.trim() !== ''))
                .map(rp => ({
                    ...rp,
                    amount: rp.amount ? String(rp.amount).replace(/,/g, '') : ''
                }))
        };
    });

    const [discrepancy, setDiscrepancy] = useState(0);
    const [isCollectionsExpanded, setIsCollectionsExpanded] = useState(true);
    const [isCreditSalesExpanded, setIsCreditSalesExpanded] = useState(true);
    const [isReceivePaymentsExpanded, setIsReceivePaymentsExpanded] = useState(true);

    const totalSalesValue = parseFloat(shift.total_sales_value) || 0;

    // Calculate totals automatically
    useEffect(() => {
        let collected = 0;
        data.collections.forEach(c => {
            collected += parseFloat(String(c.amount).replace(/,/g, '')) || 0;
        });
        data.credit_sales.forEach(cs => {
            collected += parseFloat(String(cs.amount).replace(/,/g, '')) || 0;
        });
        
        let received = 0;
        data.receive_payments.forEach(rp => {
            received += parseFloat(String(rp.amount).replace(/,/g, '')) || 0;
        });

        setDiscrepancy((collected - received) - totalSalesValue);
    }, [data, totalSalesValue]);

    // Collection Handlers
    const addCollection = () => {
        setData('collections', [...data.collections, { chart_of_acc_id: '', description: '', amount: '0.00' }]);
    };
    const removeCollection = (index) => {
        const remaining = data.collections.filter((_, i) => i !== index);
        setData('collections', remaining.length > 0 ? remaining : [{ chart_of_acc_id: '', description: '', amount: '0.00' }]);
    };
    const handleCollectionChange = (index, field, value) => {
        const newCollections = [...data.collections];
        newCollections[index][field] = value;
        setData('collections', newCollections);
    };

    // Credit invoice Handlers
    const addCreditSale = () => {
        setData('credit_sales', [...data.credit_sales, { customer_id: '', description: '', amount: '' }]);
    };
    const removeCreditSale = (index) => {
        const remaining = data.credit_sales.filter((_, i) => i !== index);
        setData('credit_sales', remaining.length > 0 ? remaining : [{ customer_id: '', description: '', amount: '' }]);
    };
    const handleCreditSaleChange = (index, field, value) => {
        const newCreditSales = [...data.credit_sales];
        newCreditSales[index][field] = value;
        setData('credit_sales', newCreditSales);
    };

    // Receive Payment Handlers
    const addReceivePayment = () => {
        setData('receive_payments', [...data.receive_payments, { customer_id: '', description: '', amount: '' }]);
    };
    const removeReceivePayment = (index) => {
        const remaining = data.receive_payments.filter((_, i) => i !== index);
        setData('receive_payments', remaining.length > 0 ? remaining : [{ customer_id: '', description: '', amount: '' }]);
    };
    const handleReceivePaymentChange = (index, field, value) => {
        const newReceivePayments = [...data.receive_payments];
        newReceivePayments[index][field] = value;
        setData('receive_payments', newReceivePayments);
    };

    const handleAmountBlur = (type, index, value) => {
        if (!document.hasFocus()) return; // Skip auto-format if window loses focus (e.g., Alt+Tab)
        const cleanValue = String(value).replace(/,/g, '');
        const val = parseFloat(cleanValue);
        if (!isNaN(val)) {
            const formatted = val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            if (type === 'collection') {
                handleCollectionChange(index, 'amount', formatted);
            } else if (type === 'credit') {
                handleCreditSaleChange(index, 'amount', formatted);
            } else if (type === 'receive_payment') {
                handleReceivePaymentChange(index, 'amount', formatted);
            }
        }
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('shifts.settle', shift.id));
    };

    const submitDraft = () => {
        post(route('shifts.draft', shift.id));
    };

    const submitReopen = () => {
        router.put(route('shifts.reopen', shift.id));
    };

    const isMatch = Math.abs(discrepancy) < 0.01;
    const canSubmit = !processing && isMatch;

    const defaultCashAccId = accounts.find(a => a.name.toLowerCase().includes('cash'))?.id || accounts[0]?.id;

    const handleAutoFillDiscrepancy = () => {
        if (discrepancy >= -0.01) return;
        const amountToAdd = Math.abs(discrepancy);
        const newCollections = [...data.collections];

        const existingIdx = newCollections.findIndex(c => c.chart_of_acc_id === defaultCashAccId);
        if (existingIdx >= 0) {
            const currentAmount = parseFloat(String(newCollections[existingIdx].amount).replace(/,/g, '')) || 0;
            newCollections[existingIdx].amount = (currentAmount + amountToAdd).toLocaleString(undefined, { minimumFractionDigits: 2 });
        } else {
            const emptyIdx = newCollections.findIndex(c => !c.chart_of_acc_id && parseFloat(String(c.amount).replace(/,/g, '')) === 0);
            if (emptyIdx >= 0) {
                newCollections[emptyIdx] = { chart_of_acc_id: defaultCashAccId, description: 'Cash In Hand', amount: amountToAdd.toLocaleString(undefined, { minimumFractionDigits: 2 }) };
            } else {
                newCollections.push({
                    chart_of_acc_id: defaultCashAccId,
                    description: 'Cash In Hand',
                    amount: amountToAdd.toLocaleString(undefined, { minimumFractionDigits: 2 })
                });
            }
        }
        setData('collections', newCollections);
        setIsCollectionsExpanded(true);
    };

    return (
        <AuthenticatedLayout header="Shift Collections">
            <Head title={`Shift Collections #${shift.shift_number || shift.id}`} />

            <div className="py-4 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-slate-50/80 border-b border-slate-200 p-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Operator</span>
                                <span className="font-bold text-slate-900 text-sm">{shift.employee?.name}</span>
                            </div>
                            <div>
                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time</span>
                                <span className="font-bold text-slate-900 text-sm">{dayjs(shift.start_time).format('MMM D, h:mm A')} - {dayjs(shift.end_time).format('MMM D, h:mm A')}</span>
                            </div>
                            <div>
                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</span>
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">{shift.status === 'closed' ? 'Closed' : 'Pending Collection'}</span>
                            </div>
                            <div>
                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Sales</span>
                                <span className="font-bold text-slate-900 text-sm font-mono">{DEFAULT_CURRENCY} {totalSalesValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={submit} className="p-6 space-y-8">
                        {/* Collections Section */}
                        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm transition-all duration-300">
                            <button
                                type="button"
                                onClick={() => setIsCollectionsExpanded(!isCollectionsExpanded)}
                                className="w-full flex items-center justify-between px-5 py-4 bg-slate-50 hover:bg-slate-100/80 transition-colors duration-200 text-left border-b border-slate-200"
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`text-slate-500 transition-transform duration-300 transform inline-block text-xs ${isCollectionsExpanded ? 'rotate-90' : ''}`}>
                                        ▶
                                    </span>
                                    <span className="font-semibold text-slate-700 text-sm">Collections (Cash/Bank)</span>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase tracking-wider">
                                        {data.collections.length} lines
                                    </span>
                                </div>
                                <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                                    Total Collections: <span className="text-slate-800 font-black">{DEFAULT_CURRENCY} {data.collections.reduce((sum, coll) => sum + (parseFloat(String(coll.amount).replace(/,/g, '')) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </span>
                            </button>

                            {isCollectionsExpanded && (
                                <div className="p-4 bg-slate-50/10">
                                    <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden mt-2">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse text-xs">
                                                <thead>
                                                    <tr className="bg-slate-50 border-b border-slate-200">
                                                        <th className="w-8 px-1 py-1.5 border-r border-slate-200 text-center text-[10px] font-black text-slate-500 uppercase tracking-tight">#</th>
                                                        <th className="px-2 py-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-200">Account</th>
                                                        <th className="px-2 py-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-200">Description</th>
                                                        <th className="w-48 px-2 py-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-200">Amount</th>
                                                        <th className="w-12 px-1 py-1.5 text-center"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {data.collections.map((coll, idx) => (
                                                        <tr key={idx} className="group hover:bg-slate-50/50 transition-all">
                                                            <td className="px-1 py-0.5 align-middle border-r border-slate-100 text-center text-xs text-slate-400 font-bold">
                                                                {idx + 1}
                                                            </td>
                                                            <td className="px-0 py-0 border-r border-slate-100 align-middle h-8">
                                                                <SearchableSelect
                                                                    id={`collection_acc_${idx}`}
                                                                    options={accounts.map(a => ({ value: a.id, label: a.name }))}
                                                                    value={coll.chart_of_acc_id}
                                                                    onChange={(val) => handleCollectionChange(idx, 'chart_of_acc_id', val)}
                                                                    placeholder="Select Account..."
                                                                    variant="table"
                                                                    size="sm"
                                                                    error={errors[`collections.${idx}.chart_of_acc_id`]}
                                                                    disabled={shift.status === 'closed'}
                                                                />
                                                            </td>
                                                            <td className="px-0 py-0 border-r border-slate-100 align-middle h-8">
                                                                <CommonInput
                                                                    type="text"
                                                                    placeholder="Description"
                                                                    value={coll.description}
                                                                    variant="table"
                                                                    size="sm"
                                                                    onChange={(e) => handleCollectionChange(idx, 'description', e.target.value)}
                                                                    disabled={shift.status === 'closed'}
                                                                />
                                                            </td>
                                                            <td className="px-0 py-0 border-r border-slate-100 align-middle h-8">
                                                                <CommonInput
                                                                    type="text"
                                                                    placeholder="Amount"
                                                                    value={coll.amount}
                                                                    variant="table"
                                                                    size="sm"
                                                                    onChange={(e) => handleCollectionChange(idx, 'amount', e.target.value)}
                                                                    onBlur={(e) => handleAmountBlur('collection', idx, e.target.value)}
                                                                    onKeyDown={(e) => {
                                                                        if (shift.status !== 'closed' && e.key === 'Tab' && !e.shiftKey && idx === data.collections.length - 1) {
                                                                            e.preventDefault();
                                                                            addCollection();
                                                                            setTimeout(() => {
                                                                                const nextEl = document.getElementById(`collection_acc_${idx + 1}`);
                                                                                if (nextEl) {
                                                                                    nextEl.focus();
                                                                                    // simulate Enter key to open it automatically
                                                                                    nextEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
                                                                                }
                                                                            }, 50);
                                                                        }
                                                                    }}
                                                                    error={errors[`collections.${idx}.amount`]}
                                                                    disabled={shift.status === 'closed'}
                                                                />
                                                            </td>
                                                            <td className="px-1 py-0.5 align-middle w-12 text-center">
                                                                <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    {shift.status !== 'closed' && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => removeCollection(idx)}
                                                                            tabIndex="-1"
                                                                            className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                                                        >
                                                                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Credit invoices Section */}
                        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm transition-all duration-300">
                            <button
                                type="button"
                                onClick={() => setIsCreditSalesExpanded(!isCreditSalesExpanded)}
                                className="w-full flex items-center justify-between px-5 py-4 bg-slate-50 hover:bg-slate-100/80 transition-colors duration-200 text-left border-b border-slate-200"
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`text-slate-500 transition-transform duration-300 transform inline-block text-xs ${isCreditSalesExpanded ? 'rotate-90' : ''}`}>
                                        ▶
                                    </span>
                                    <span className="font-semibold text-slate-700 text-sm">Credit invoices</span>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase tracking-wider">
                                        {data.credit_sales.length} lines
                                    </span>
                                </div>
                                <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                                    Total Credit invoices: <span className="text-slate-800 font-black">{DEFAULT_CURRENCY} {data.credit_sales.reduce((sum, cs) => sum + (parseFloat(String(cs.amount).replace(/,/g, '')) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </span>
                            </button>

                            {isCreditSalesExpanded && (
                                <div className="p-4 bg-slate-50/10">
                                    <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden mt-2">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse text-xs">
                                                <thead>
                                                    <tr className="bg-slate-50 border-b border-slate-200">
                                                        <th className="w-8 px-1 py-1.5 border-r border-slate-200 text-center text-[10px] font-black text-slate-500 uppercase tracking-tight">#</th>
                                                        <th className="w-1/3 px-2 py-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-200">Customer</th>
                                                        <th className="px-2 py-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-200">Description/Reference</th>
                                                        <th className="w-40 px-2 py-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-200">Amount</th>
                                                        <th className="w-12 px-1 py-1.5 text-center"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {data.credit_sales.map((cs, idx) => (
                                                        <tr key={idx} className="group hover:bg-slate-50/50 transition-all">
                                                            <td className="px-1 py-0.5 align-middle border-r border-slate-100 text-center text-xs text-slate-400 font-bold">
                                                                {idx + 1}
                                                            </td>
                                                            <td className="px-0 py-0 border-r border-slate-100 align-middle h-8">
                                                                <SearchableSelect
                                                                    id={`credit_cust_${idx}`}
                                                                    options={customers.map(c => ({ value: c.id, label: c.display_name }))}
                                                                    value={cs.customer_id}
                                                                    onChange={(val) => handleCreditSaleChange(idx, 'customer_id', val)}
                                                                    placeholder="Select Customer..."
                                                                    variant="table"
                                                                    size="sm"
                                                                    error={errors[`credit_sales.${idx}.customer_id`]}
                                                                    disabled={shift.status === 'closed'}
                                                                />
                                                            </td>
                                                            <td className="px-0 py-0 border-r border-slate-100 align-middle h-8">
                                                                <CommonInput
                                                                    type="text"
                                                                    placeholder="Description/Reference"
                                                                    value={cs.description}
                                                                    variant="table"
                                                                    size="sm"
                                                                    onChange={(e) => handleCreditSaleChange(idx, 'description', e.target.value)}
                                                                    disabled={shift.status === 'closed'}
                                                                />
                                                            </td>
                                                            <td className="px-0 py-0 border-r border-slate-100 align-middle h-8">
                                                                <CommonInput
                                                                    type="text"
                                                                    placeholder="Amount"
                                                                    value={cs.amount}
                                                                    variant="table"
                                                                    size="sm"
                                                                    onChange={(e) => handleCreditSaleChange(idx, 'amount', e.target.value)}
                                                                    onBlur={(e) => handleAmountBlur('credit', idx, e.target.value)}
                                                                    onKeyDown={(e) => {
                                                                        if (shift.status !== 'closed' && e.key === 'Tab' && !e.shiftKey && idx === data.credit_sales.length - 1) {
                                                                            e.preventDefault();
                                                                            addCreditSale();
                                                                            setTimeout(() => {
                                                                                const nextEl = document.getElementById(`credit_cust_${idx + 1}`);
                                                                                if (nextEl) {
                                                                                    nextEl.focus();
                                                                                    // simulate Enter key to open it automatically
                                                                                    nextEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
                                                                                }
                                                                            }, 50);
                                                                        }
                                                                    }}
                                                                    error={errors[`credit_sales.${idx}.amount`]}
                                                                    disabled={shift.status === 'closed'}
                                                                />
                                                            </td>
                                                            <td className="px-1 py-0.5 align-middle w-12 text-center">
                                                                <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    {shift.status !== 'closed' && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => removeCreditSale(idx)}
                                                                            tabIndex="-1"
                                                                            className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                                                        >
                                                                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Receive Payments Section */}
                        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm transition-all duration-300">
                            <button
                                type="button"
                                onClick={() => setIsReceivePaymentsExpanded(!isReceivePaymentsExpanded)}
                                className="w-full flex items-center justify-between px-5 py-4 bg-slate-50 hover:bg-slate-100/80 transition-colors duration-200 text-left border-b border-slate-200"
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`text-slate-500 transition-transform duration-300 transform inline-block text-xs ${isReceivePaymentsExpanded ? 'rotate-90' : ''}`}>
                                        ▶
                                    </span>
                                    <span className="font-semibold text-slate-700 text-sm">Receive Payments</span>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase tracking-wider">
                                        {data.receive_payments.length} lines
                                    </span>
                                </div>
                                <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                                    Total Received: <span className="text-slate-800 font-black">{DEFAULT_CURRENCY} {data.receive_payments.reduce((sum, rp) => sum + (parseFloat(String(rp.amount).replace(/,/g, '')) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </span>
                            </button>

                            {isReceivePaymentsExpanded && (
                                <div className="p-4 bg-slate-50/10">
                                    <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden mt-2">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse text-xs">
                                                <thead>
                                                    <tr className="bg-slate-50 border-b border-slate-200">
                                                        <th className="w-8 px-1 py-1.5 border-r border-slate-200 text-center text-[10px] font-black text-slate-500 uppercase tracking-tight">#</th>
                                                        <th className="w-1/3 px-2 py-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-200">Customer</th>
                                                        <th className="px-2 py-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-200">Description/Reference</th>
                                                        <th className="w-40 px-2 py-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-200">Amount</th>
                                                        <th className="w-12 px-1 py-1.5 text-center"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {data.receive_payments.map((rp, idx) => (
                                                        <tr key={idx} className="group hover:bg-slate-50/50 transition-all">
                                                            <td className="px-1 py-0.5 align-middle border-r border-slate-100 text-center text-xs text-slate-400 font-bold">
                                                                {idx + 1}
                                                            </td>
                                                            <td className="px-0 py-0 border-r border-slate-100 align-middle h-8">
                                                                <SearchableSelect
                                                                    id={`receive_cust_${idx}`}
                                                                    options={customers.map(c => ({ value: c.id, label: c.display_name }))}
                                                                    value={rp.customer_id}
                                                                    onChange={(val) => handleReceivePaymentChange(idx, 'customer_id', val)}
                                                                    placeholder="Select Customer..."
                                                                    variant="table"
                                                                    size="sm"
                                                                    error={errors[`receive_payments.${idx}.customer_id`]}
                                                                    disabled={shift.status === 'closed'}
                                                                />
                                                            </td>
                                                            <td className="px-0 py-0 border-r border-slate-100 align-middle h-8">
                                                                <CommonInput
                                                                    type="text"
                                                                    placeholder="Description/Reference"
                                                                    value={rp.description}
                                                                    variant="table"
                                                                    size="sm"
                                                                    onChange={(e) => handleReceivePaymentChange(idx, 'description', e.target.value)}
                                                                    disabled={shift.status === 'closed'}
                                                                />
                                                            </td>
                                                            <td className="px-0 py-0 border-r border-slate-100 align-middle h-8">
                                                                <CommonInput
                                                                    type="text"
                                                                    placeholder="Amount"
                                                                    value={rp.amount}
                                                                    variant="table"
                                                                    size="sm"
                                                                    onChange={(e) => handleReceivePaymentChange(idx, 'amount', e.target.value)}
                                                                    onBlur={(e) => handleAmountBlur('receive_payment', idx, e.target.value)}
                                                                    onKeyDown={(e) => {
                                                                        if (shift.status !== 'closed' && e.key === 'Tab' && !e.shiftKey && idx === data.receive_payments.length - 1) {
                                                                            e.preventDefault();
                                                                            addReceivePayment();
                                                                            setTimeout(() => {
                                                                                const nextEl = document.getElementById(`receive_cust_${idx + 1}`);
                                                                                if (nextEl) {
                                                                                    nextEl.focus();
                                                                                    // simulate Enter key to open it automatically
                                                                                    nextEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
                                                                                }
                                                                            }, 50);
                                                                        }
                                                                    }}
                                                                    error={errors[`receive_payments.${idx}.amount`]}
                                                                    disabled={shift.status === 'closed'}
                                                                />
                                                            </td>
                                                            <td className="px-1 py-0.5 align-middle w-12 text-center">
                                                                <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    {shift.status !== 'closed' && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => removeReceivePayment(idx)}
                                                                            tabIndex="-1"
                                                                            className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                                                        >
                                                                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Summary and Submit */}
                        <div>
                            {errors.discrepancy && (
                                <div className="mb-4 p-4 bg-red-50 text-red-700 text-sm font-bold border border-red-200 rounded-lg text-center">
                                    {errors.discrepancy}
                                </div>
                            )}

                            <div className={`p-4 border rounded-xl flex items-center justify-between ${discrepancy < -0.01 ? 'bg-red-50 border-red-200' : (discrepancy > 0.01 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200')}`}>
                                <div>
                                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Discrepancy</span>
                                    <span className={`text-xs font-bold ${discrepancy < -0.01 ? 'text-red-600' : (discrepancy > 0.01 ? 'text-red-600' : 'text-emerald-600')}`}>
                                        {discrepancy < -0.01 ? 'Short by' : (discrepancy > 0.01 ? 'Over by' : 'Perfect Match')}
                                    </span>
                                </div>
                                <div className={`font-mono font-bold text-lg flex items-center gap-2 ${discrepancy < -0.01 ? 'text-red-700' : (discrepancy > 0.01 ? 'text-red-700' : 'text-emerald-700')}`}>
                                    {discrepancy > 0.01 ? '+' : ''}{discrepancy.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    {shift.status !== 'closed' && discrepancy < -0.01 && (
                                        <button
                                            type="button"
                                            onClick={handleAutoFillDiscrepancy}
                                            title="Autofill remaining shortage to Cash Collection"
                                            className="p-1 hover:bg-red-100 rounded-md text-red-500 transition-colors"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center gap-4 pt-4 border-t border-slate-100 mt-6">
                            <div>
                                <a href={route('shifts.export-pdf', shift.id)} target="_blank" rel="noopener noreferrer">
                                    <CommonButton variant="secondary" type="button" className="px-4 py-1.5 text-xs flex items-center gap-2">
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        Download Report
                                    </CommonButton>
                                </a>
                            </div>
                            {shift.status !== 'closed' && (
                                <div className="flex items-center gap-4">
                                    <CommonButton
                                        variant="secondary"
                                        type="button"
                                        onClick={submitDraft}
                                        processing={processing}
                                        className="px-4 py-1.5 text-xs"
                                    >
                                        Save Draft
                                    </CommonButton>
                                    <CommonButton
                                        variant="primary"
                                        type="submit"
                                        processing={processing}
                                        disabled={!canSubmit}
                                        className={`px-4 py-1.5 text-xs ${!canSubmit ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        title={!isMatch ? "Total collections and Credit invoices must exactly match Total Sales." : ""}
                                    >
                                        {processing ? 'Processing...' : 'Settle & Close Shift'}
                                    </CommonButton>
                                </div>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
