import React, { useEffect, useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CommonButton from '@/Components/CommonButton';
import dayjs from 'dayjs';

export default function Close({ shift }) {
    const initialItems = (shift.shift_items || []).map(si => ({
        id: si.id,
        name: si.item?.name || 'Item',
        sku: si.item?.sku || '',
        price: parseFloat(si.unit_price) > 0 ? parseFloat(si.unit_price) : parseFloat(si.item?.sale_price || 0),
        issued_qty: parseFloat(si.issued_qty || 0),
        returned_qty: si.returned_qty !== null && si.returned_qty !== undefined ? parseFloat(si.returned_qty) : 0,
    }));

    const { data, setData, put, processing, errors, transform } = useForm({
        items: initialItems,
        end_time: shift.end_time ? shift.end_time.slice(0, 16) : dayjs().format('YYYY-MM-DDTHH:mm'),
    });

    const [totalSalesValue, setTotalSalesValue] = useState(0);

    // Calculate totals automatically
    useEffect(() => {
        let total = 0;
        data.items.forEach(it => {
            const issued = parseFloat(it.issued_qty) || 0;
            const returned = parseFloat(String(it.returned_qty).replace(/,/g, '')) || 0;
            const sold = Math.max(0, issued - returned);
            total += (sold * it.price);
        });
        setTotalSalesValue(total);
    }, [data.items]);

    const handleReturnedChange = (index, value) => {
        const newItems = [...data.items];
        newItems[index].returned_qty = value;
        setData('items', newItems);
    };

    const submit = (e) => {
        e.preventDefault();
        transform((d) => ({
            ...d,
            items: d.items.map(it => ({
                id: it.id,
                returned_qty: parseFloat(String(it.returned_qty).replace(/,/g, '')) || 0
            }))
        }));
        put(route('stock-shifts.update', shift.id));
    };

    return (
        <AuthenticatedLayout header={shift.status === 'open' ? "Close Stock Shift" : "Update Shift Stock Returns"}>
            <Head title={shift.status === 'open' ? "Close Stock Shift" : "Update Shift Stock Returns"} />

            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
                {/* Summary Banner */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
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
                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Started</span>
                                <span className="font-bold text-slate-900 text-sm">{dayjs(shift.start_time).format('MMM D, h:mm A')}</span>
                            </div>
                            <div>
                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${shift.status === 'open' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                                    {shift.status}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                Shift End / Return Time
                            </label>
                            <input
                                type="datetime-local"
                                value={data.end_time}
                                onChange={(e) => setData('end_time', e.target.value)}
                                className="h-[30px] px-2 py-0 border border-slate-300 rounded-sm text-xs focus:ring-2 focus:ring-[#00713D]/20 focus:border-[#00713D] text-slate-900"
                            />
                        </div>
                        <div className="text-right">
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Total Sales Value
                            </span>
                            <span className="text-xl font-black text-[#00713D] font-mono">
                                {totalSalesValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Stock Returns Form */}
                <form onSubmit={submit} className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-1">
                            Physical Stock Return Count
                        </h2>
                        <p className="text-xs text-slate-500 mb-4 pb-2 border-b">
                            Enter the remaining/returned quantity for each item. Sold quantity and sales value are automatically calculated.
                        </p>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="px-3 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Item Description</th>
                                        <th className="px-3 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Unit Price</th>
                                        <th className="px-3 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Issued Qty</th>
                                        <th className="px-3 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right w-36">Returned Qty</th>
                                        <th className="px-3 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Sold Qty</th>
                                        <th className="px-3 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Total Value</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {data.items.map((row, idx) => {
                                        const issued = parseFloat(row.issued_qty) || 0;
                                        const returned = parseFloat(String(row.returned_qty).replace(/,/g, '')) || 0;
                                        const sold = Math.max(0, issued - returned);
                                        const lineTotal = sold * row.price;

                                        return (
                                            <tr key={row.id} className="hover:bg-slate-50/50">
                                                <td className="px-3 py-3">
                                                    <div className="font-bold text-slate-900">{row.name}</div>
                                                    {row.sku && <div className="text-[10px] text-slate-400 font-mono">{row.sku}</div>}
                                                </td>
                                                <td className="px-3 py-3 text-center font-mono text-slate-700">
                                                    {row.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-3 py-3 text-center font-mono font-bold text-slate-800">
                                                    {issued.toLocaleString()}
                                                </td>
                                                <td className="px-3 py-3 text-right">
                                                    <input
                                                        type="number"
                                                        step="any"
                                                        min="0"
                                                        max={issued}
                                                        value={row.returned_qty}
                                                        onChange={(e) => handleReturnedChange(idx, e.target.value)}
                                                        className="w-full h-[30px] px-2 py-0 border border-slate-300 rounded-sm text-xs text-right font-mono font-bold focus:ring-2 focus:ring-[#00713D]/20 focus:border-[#00713D] text-slate-900 bg-white"
                                                    />
                                                    {errors[`items.${idx}.returned_qty`] && (
                                                        <p className="text-[10px] text-red-500 font-bold mt-0.5">{errors[`items.${idx}.returned_qty`]}</p>
                                                    )}
                                                </td>
                                                <td className="px-3 py-3 text-center font-mono font-bold text-blue-600">
                                                    {sold.toLocaleString()}
                                                </td>
                                                <td className="px-3 py-3 text-right font-mono font-bold text-[#00713D]">
                                                    {lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-slate-50 border-t border-slate-300 font-bold">
                                        <td colSpan="5" className="px-3 py-3 text-right text-slate-700 uppercase tracking-widest text-[11px]">
                                            Total Calculated Sales:
                                        </td>
                                        <td className="px-3 py-3 text-right font-mono text-base text-[#00713D]">
                                            {totalSalesValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Submit Actions */}
                    <div className="flex items-center justify-end gap-3">
                        <Link href={route('stock-shifts.index')}>
                            <CommonButton variant="secondary">
                                Cancel
                            </CommonButton>
                        </Link>
                        <CommonButton
                            type="submit"
                            variant="primary"
                            disabled={processing}
                            className="bg-[#00713D] hover:bg-[#005a30] text-white px-6"
                        >
                            {processing ? 'Processing...' : (shift.status === 'open' ? 'Close Shift & Return Stock' : 'Update Stock Returns')}
                        </CommonButton>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
