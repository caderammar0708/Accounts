import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CommonButton from '@/Components/CommonButton';
import SearchableSelect from '@/Components/SearchableSelect';
import dayjs from 'dayjs';

export default function Create({ shift, locations = [], employees = [], items = [], lastEndTime }) {
    const isEdit = !!shift;

    const initialItems = isEdit && shift.shift_items ? shift.shift_items.map(si => ({
        item_id: si.item_id,
        issued_qty: parseFloat(si.issued_qty) || 0
    })) : [
        { item_id: '', issued_qty: '' }
    ];

    const { data, setData, post, put, processing, errors, transform } = useForm({
        location_id: isEdit ? (shift.location_id || '') : (locations.length > 0 ? locations[0].id : ''),
        employee_id: isEdit ? (shift.employee_id || '') : '',
        start_time: isEdit ? shift.start_time.slice(0, 16) : (lastEndTime ? dayjs(lastEndTime).format('YYYY-MM-DDTHH:mm') : dayjs().format('YYYY-MM-DDTHH:mm')),
        items: initialItems,
        notes: isEdit ? (shift.notes || '') : ''
    });

    // Filter items based on selected location if items are location-specific, otherwise show all items
    const availableItems = items.filter(it => !it.location_id || it.location_id == data.location_id);

    const handleAddItemRow = () => {
        setData('items', [...data.items, { item_id: '', issued_qty: '' }]);
    };

    const handleRemoveItemRow = (index) => {
        const remaining = data.items.filter((_, i) => i !== index);
        setData('items', remaining.length > 0 ? remaining : [{ item_id: '', issued_qty: '' }]);
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...data.items];
        newItems[index][field] = value;
        setData('items', newItems);
    };

    const submit = (e) => {
        e.preventDefault();
        transform((d) => ({
            ...d,
            items: d.items
                .filter(i => i.item_id && parseFloat(String(i.issued_qty).replace(/,/g, '')) > 0)
                .map(i => ({
                    item_id: i.item_id,
                    issued_qty: parseFloat(String(i.issued_qty).replace(/,/g, '')) || 0
                }))
        }));

        if (isEdit) {
            put(route('stock-shifts.update-active', shift.id));
        } else {
            post(route('stock-shifts.store'));
        }
    };

    return (
        <AuthenticatedLayout header={isEdit ? "Edit Active Stock Shift" : "Start Stock Shift"}>
            <Head title={isEdit ? "Edit Active Stock Shift" : "Start Stock Shift"} />

            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
                <form onSubmit={submit} className="space-y-6">
                    {/* Shift & Employee Details */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                            <div>
                                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">
                                    {isEdit ? "Active Shift Details" : "New Stock Shift Setup"}
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">Select the branch, assigned employee, and shift start time.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            {/* Branch Selection */}
                            <div className="w-full">
                                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">
                                    Branch / Location <span className="text-red-500">*</span>
                                </label>
                                <SearchableSelect
                                    options={locations.map(l => ({ value: l.id, label: l.name }))}
                                    value={data.location_id}
                                    onChange={(val) => setData('location_id', val)}
                                    placeholder="Select Branch..."
                                    error={errors.location_id}
                                    disabled={isEdit}
                                />
                                {errors.location_id && <p className="mt-1 text-[10px] text-red-500 font-bold">{errors.location_id}</p>}
                            </div>

                            {/* Employee Selection */}
                            <div className="w-full">
                                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">
                                    Assigned Employee <span className="text-red-500">*</span>
                                </label>
                                <SearchableSelect
                                    options={employees.map(e => ({ value: e.id, label: e.name }))}
                                    value={data.employee_id}
                                    onChange={(val) => setData('employee_id', val)}
                                    placeholder="Select Employee..."
                                    error={errors.employee_id}
                                />
                                {errors.employee_id && <p className="mt-1 text-[10px] text-red-500 font-bold">{errors.employee_id}</p>}
                            </div>

                            {/* Start Time */}
                            <div className="w-full">
                                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">
                                    Start Time <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="datetime-local"
                                    value={data.start_time}
                                    onChange={(e) => setData('start_time', e.target.value)}
                                    className="w-full h-[30px] px-2 py-0 border border-slate-300 rounded-sm text-xs focus:ring-2 focus:ring-[#00713D]/20 focus:border-[#00713D] text-slate-900 bg-white"
                                />
                                {errors.start_time && <p className="mt-1 text-[10px] text-red-500 font-bold">{errors.start_time}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Assign Stock Section */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                            <div>
                                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">
                                    Assign Stock Items
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Select the items (Reload Cards, SIMs, Recharge Cards) and enter the quantities issued to the employee.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleAddItemRow}
                                className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-[#00713D] border border-emerald-200 rounded text-xs font-bold transition-colors flex items-center gap-1"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                                Add Item Row
                            </button>
                        </div>

                        {errors.items && typeof errors.items === 'string' && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-bold">
                                {errors.items}
                            </div>
                        )}

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-1/2">Item Type / Product</th>
                                        <th className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Available Stock</th>
                                        <th className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Unit Price</th>
                                        <th className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right w-36">Issued Qty</th>
                                        <th className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center w-12"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {data.items.map((row, idx) => {
                                        const selectedItem = items.find(it => String(it.id) === String(row.item_id));
                                        const stockAvailable = selectedItem ? parseFloat(selectedItem.quantity_on_hand || 0) : null;
                                        const unitPrice = selectedItem ? parseFloat(selectedItem.sale_price || 0) : 0;

                                        return (
                                            <tr key={idx} className="hover:bg-slate-50/50">
                                                <td className="px-3 py-2.5">
                                                    <SearchableSelect
                                                        options={availableItems.map(it => ({
                                                            value: it.id,
                                                            label: `${it.name}${it.sku ? ` (${it.sku})` : ''}`,
                                                            balance: it.quantity_on_hand
                                                        }))}
                                                        value={row.item_id}
                                                        onChange={(val) => handleItemChange(idx, 'item_id', val)}
                                                        placeholder="Choose item (Reload, SIM, Card)..."
                                                        size="sm"
                                                    />
                                                    {errors[`items.${idx}.item_id`] && (
                                                        <p className="text-[10px] text-red-500 font-bold mt-0.5">{errors[`items.${idx}.item_id`]}</p>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2.5 text-center font-mono">
                                                    {stockAvailable !== null ? (
                                                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${stockAvailable <= 0 ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-700'}`}>
                                                            {stockAvailable.toLocaleString()}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2.5 text-center font-mono text-slate-700">
                                                    {unitPrice > 0 ? unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                                                </td>
                                                <td className="px-3 py-2.5 text-right">
                                                    <input
                                                        type="number"
                                                        step="any"
                                                        min="0"
                                                        placeholder="0"
                                                        value={row.issued_qty}
                                                        onChange={(e) => handleItemChange(idx, 'issued_qty', e.target.value)}
                                                        className="w-full h-[30px] px-2 py-0 border border-slate-300 rounded-sm text-xs text-right font-mono font-bold focus:ring-2 focus:ring-[#00713D]/20 focus:border-[#00713D] text-slate-900 bg-white"
                                                    />
                                                    {errors[`items.${idx}.issued_qty`] && (
                                                        <p className="text-[10px] text-red-500 font-bold mt-0.5">{errors[`items.${idx}.issued_qty`]}</p>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2.5 text-center">
                                                    {data.items.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveItemRow(idx)}
                                                            className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                                                            title="Remove row"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Actions */}
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
                            {processing ? 'Processing...' : (isEdit ? 'Update Active Shift' : 'Start Shift & Issue Stock')}
                        </CommonButton>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
