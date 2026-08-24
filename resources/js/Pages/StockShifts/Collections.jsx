import React, { useEffect, useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CommonButton from '@/Components/CommonButton';
import CommonInput from '@/Components/CommonInput';
import SearchableSelect from '@/Components/SearchableSelect';
import dayjs from 'dayjs';
import { DEFAULT_CURRENCY } from '@/Utils/Constants';

export default function Collections({ shift, accounts = [], customers = [] }) {
    const { data, setData, post, processing, errors, transform } = useForm({
        collections: shift.collections?.length > 0 ? shift.collections.map(c => ({
            chart_of_acc_id: c.chart_of_acc_id,
            description: c.description || "",
            amount: parseFloat(c.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })
        })) : [
            { chart_of_acc_id: '', description: '', amount: '0.00' }
        ],
        credit_sales: shift.credit_sales && shift.credit_sales.length > 0 ? shift.credit_sales.map(cs => ({
            customer_id: cs.customer_id,
            description: cs.description || "",
            amount: cs.amount ? parseFloat(cs.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''
        })) : [{ customer_id: '', description: '', amount: '' }]
    });

    transform((formData) => {
        const cleanVal = (v) => parseFloat(String(v || 0).replace(/,/g, '')) || 0;
        return {
            ...formData,
            collections: formData.collections
                .filter(c => c.chart_of_acc_id || cleanVal(c.amount) !== 0 || (c.description && c.description.trim() !== ''))
                .map(c => ({
                    ...c,
                    amount: c.amount ? String(c.amount).replace(/,/g, '') : ''
                })),
            credit_sales: formData.credit_sales
                .filter(cs => cs.customer_id || cleanVal(cs.amount) !== 0 || (cs.description && cs.description.trim() !== ''))
                .map(cs => ({
                    ...cs,
                    amount: cs.amount ? String(cs.amount).replace(/,/g, '') : ''
                }))
        };
    });

    const [discrepancy, setDiscrepancy] = useState(0);
    const [isCollectionsExpanded, setIsCollectionsExpanded] = useState(true);
    const [isCreditSalesExpanded, setIsCreditSalesExpanded] = useState(true);

    const totalSalesValue = parseFloat(shift.total_sales_value) || 0;

    // Calculate discrepancy automatically
    useEffect(() => {
        let collected = 0;
        data.collections.forEach(c => {
            collected += parseFloat(String(c.amount).replace(/,/g, '')) || 0;
        });
        data.credit_sales.forEach(cs => {
            collected += parseFloat(String(cs.amount).replace(/,/g, '')) || 0;
        });

        setDiscrepancy(collected - totalSalesValue);
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

    // Credit sales Handlers
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

    const handleAmountBlur = (type, index, value) => {
        const cleanValue = String(value).replace(/,/g, '');
        const val = parseFloat(cleanValue);
        if (!isNaN(val)) {
            const formatted = val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            if (type === 'collection') {
                handleCollectionChange(index, 'amount', formatted);
            } else if (type === 'credit') {
                handleCreditSaleChange(index, 'amount', formatted);
            }
        }
    };

    const handleSaveDraft = (e) => {
        e.preventDefault();
        post(route('stock-shifts.draft', shift.id));
    };

    const handleSettle = (e) => {
        e.preventDefault();
        post(route('stock-shifts.settle', shift.id));
    };

    return (
        <AuthenticatedLayout header="Stock Shift Collections">
            <Head title={`Shift Collections #${substrId(shift.id)}`} />

            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-6">
                {/* Header Info Banner */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50/80 border-b border-slate-200 p-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Branch</span>
                                <span className="font-bold text-slate-900 text-sm">{shift.location?.name || 'Default Branch'}</span>
                            </div>
                            <div>
                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employee</span>
                                <span className="font-bold text-slate-900 text-sm">{shift.employee?.name}</span>
                            </div>
                            <div>
                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time</span>
                                <span className="font-bold text-slate-900 text-sm">{dayjs(shift.start_time).format('MMM D, h:mm A')} - {shift.end_time ? dayjs(shift.end_time).format('MMM D, h:mm A') : 'Ongoing'}</span>
                            </div>
                            <div>
                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Sales Value</span>
                                <span className="font-bold text-[#00713D] text-base font-mono">
                                    {totalSalesValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 1: Collections (Cash / Bank) */}
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    <button
                        type="button"
                        onClick={() => setIsCollectionsExpanded(!isCollectionsExpanded)}
                        className="w-full flex items-center justify-between px-5 py-4 bg-slate-50 hover:bg-slate-100/80 transition-colors text-left border-b border-slate-200"
                    >
                        <div className="flex items-center gap-3">
                            <span className={`text-slate-500 transition-transform duration-200 transform inline-block text-xs ${isCollectionsExpanded ? 'rotate-90' : ''}`}>
                                ▶
                            </span>
                            <span className="font-bold text-slate-800 text-sm">Collections (Cash, Bank, Transfers)</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-[#00713D] font-bold uppercase tracking-wider">
                                {data.collections.length} lines
                            </span>
                        </div>
                        <span className="text-xs font-bold text-slate-500">
                            Total: <span className="text-slate-900 font-mono font-black">{data.collections.reduce((sum, coll) => sum + (parseFloat(String(coll.amount).replace(/,/g, '')) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </span>
                    </button>

                    {isCollectionsExpanded && (
                        <div className="p-4">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200">
                                            <th className="w-8 px-2 py-2 text-center text-[10px] font-bold text-slate-500 uppercase tracking-tight">#</th>
                                            <th className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Account (Cash/Bank)</th>
                                            <th className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Description</th>
                                            <th className="w-48 px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Amount</th>
                                            <th className="w-10 px-2 py-2 text-center"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {data.collections.map((coll, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/50">
                                                <td className="px-2 py-2 text-center text-slate-400 font-bold">{idx + 1}</td>
                                                <td className="px-3 py-2">
                                                    <SearchableSelect
                                                        options={accounts.map(a => ({ value: a.id, label: a.name }))}
                                                        value={coll.chart_of_acc_id}
                                                        onChange={(val) => handleCollectionChange(idx, 'chart_of_acc_id', val)}
                                                        placeholder="Select Account (e.g. Cash in Hand)..."
                                                        size="sm"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Optional notes"
                                                        value={coll.description}
                                                        onChange={(e) => handleCollectionChange(idx, 'description', e.target.value)}
                                                        className="w-full h-[30px] px-2 py-0 border border-slate-300 rounded-sm text-xs focus:ring-2 focus:ring-[#00713D]/20 focus:border-[#00713D] text-slate-900"
                                                    />
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                    <input
                                                        type="text"
                                                        placeholder="0.00"
                                                        value={coll.amount}
                                                        onChange={(e) => handleCollectionChange(idx, 'amount', e.target.value)}
                                                        onBlur={(e) => handleAmountBlur('collection', idx, e.target.value)}
                                                        className="w-full h-[30px] px-2 py-0 border border-slate-300 rounded-sm text-xs text-right font-mono font-bold focus:ring-2 focus:ring-[#00713D]/20 focus:border-[#00713D] text-slate-900"
                                                    />
                                                </td>
                                                <td className="px-2 py-2 text-center">
                                                    {data.collections.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeCollection(idx)}
                                                            className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-3">
                                <button
                                    type="button"
                                    onClick={addCollection}
                                    className="px-3 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-xs font-bold transition-colors flex items-center gap-1"
                                >
                                    + Add Collection Row
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Section 2: Customer Credit Sales */}
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    <button
                        type="button"
                        onClick={() => setIsCreditSalesExpanded(!isCreditSalesExpanded)}
                        className="w-full flex items-center justify-between px-5 py-4 bg-slate-50 hover:bg-slate-100/80 transition-colors text-left border-b border-slate-200"
                    >
                        <div className="flex items-center gap-3">
                            <span className={`text-slate-500 transition-transform duration-200 transform inline-block text-xs ${isCreditSalesExpanded ? 'rotate-90' : ''}`}>
                                ▶
                            </span>
                            <span className="font-bold text-slate-800 text-sm">Customer Credit Sales (Accounts Receivable)</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold uppercase tracking-wider">
                                {data.credit_sales.length} lines
                            </span>
                        </div>
                        <span className="text-xs font-bold text-slate-500">
                            Total: <span className="text-slate-900 font-mono font-black">{data.credit_sales.reduce((sum, cs) => sum + (parseFloat(String(cs.amount).replace(/,/g, '')) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </span>
                    </button>

                    {isCreditSalesExpanded && (
                        <div className="p-4">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200">
                                            <th className="w-8 px-2 py-2 text-center text-[10px] font-bold text-slate-500 uppercase tracking-tight">#</th>
                                            <th className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Customer</th>
                                            <th className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Reference / Description</th>
                                            <th className="w-48 px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Amount</th>
                                            <th className="w-10 px-2 py-2 text-center"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {data.credit_sales.map((cs, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/50">
                                                <td className="px-2 py-2 text-center text-slate-400 font-bold">{idx + 1}</td>
                                                <td className="px-3 py-2">
                                                    <SearchableSelect
                                                        options={customers.map(c => ({ value: c.id, label: c.name }))}
                                                        value={cs.customer_id}
                                                        onChange={(val) => handleCreditSaleChange(idx, 'customer_id', val)}
                                                        placeholder="Select Customer..."
                                                        size="sm"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Invoice memo"
                                                        value={cs.description}
                                                        onChange={(e) => handleCreditSaleChange(idx, 'description', e.target.value)}
                                                        className="w-full h-[30px] px-2 py-0 border border-slate-300 rounded-sm text-xs focus:ring-2 focus:ring-[#00713D]/20 focus:border-[#00713D] text-slate-900"
                                                    />
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                    <input
                                                        type="text"
                                                        placeholder="0.00"
                                                        value={cs.amount}
                                                        onChange={(e) => handleCreditSaleChange(idx, 'amount', e.target.value)}
                                                        onBlur={(e) => handleAmountBlur('credit', idx, e.target.value)}
                                                        className="w-full h-[30px] px-2 py-0 border border-slate-300 rounded-sm text-xs text-right font-mono font-bold focus:ring-2 focus:ring-[#00713D]/20 focus:border-[#00713D] text-slate-900"
                                                    />
                                                </td>
                                                <td className="px-2 py-2 text-center">
                                                    {data.credit_sales.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeCreditSale(idx)}
                                                            className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-3">
                                <button
                                    type="button"
                                    onClick={addCreditSale}
                                    className="px-3 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-xs font-bold transition-colors flex items-center gap-1"
                                >
                                    + Add Credit Sale Row
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Settlement Summary & Discrepancy Box */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${Math.abs(discrepancy) < 0.01 ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`}></div>
                            <div>
                                <div className="text-xs font-bold text-slate-600">Discrepancy / Variance:</div>
                                <div className={`text-base font-black font-mono ${Math.abs(discrepancy) < 0.01 ? 'text-[#00713D]' : 'text-red-600'}`}>
                                    {discrepancy.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                            </div>
                        </div>

                        {errors.discrepancy && (
                            <div className="text-red-500 text-xs font-bold">{errors.discrepancy}</div>
                        )}

                        <div className="flex items-center gap-3">
                            <Link href={route('stock-shifts.index')}>
                                <CommonButton variant="secondary">
                                    Back to Shifts
                                </CommonButton>
                            </Link>
                            <button
                                type="button"
                                onClick={handleSaveDraft}
                                disabled={processing}
                                className="px-4 py-2 border border-slate-300 rounded-sm text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm"
                            >
                                Save Draft
                            </button>
                            <CommonButton
                                type="button"
                                variant="primary"
                                onClick={handleSettle}
                                disabled={processing || Math.abs(discrepancy) >= 0.01}
                                className="bg-[#00713D] hover:bg-[#005a30] text-white px-6 font-bold"
                            >
                                Settle & Close Shift
                            </CommonButton>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function substrId(id) {
    if (!id) return '';
    return String(id).substring(0, 8);
}
