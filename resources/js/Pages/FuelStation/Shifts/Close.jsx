import React, { useEffect, useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CommonButton from '@/Components/CommonButton';
import CommonInput from '@/Components/CommonInput';
import SearchableSelect from '@/Components/SearchableSelect';
import dayjs from 'dayjs';
import { DEFAULT_CURRENCY } from '@/Utils/Constants';

export default function Close({ shift }) {

    // Map initial shift nozzles data
    const initialNozzles = shift.shift_nozzles.map(sn => ({
        id: sn.id,
        name: sn.nozzle.name,
        pump_name: sn.nozzle.pump?.name,
        fuel_name: sn.nozzle.tank?.fuel_type?.name,
        price: parseFloat(sn.price_per_liter) > 0 ? parseFloat(sn.price_per_liter) : parseFloat(sn.nozzle.tank?.fuel_type?.sale_price || 0),
        opening_reading: (parseFloat(sn.opening_reading) || 0).toLocaleString('en-US', {minimumFractionDigits: 3, maximumFractionDigits: 3}),
        closing_reading: (parseFloat(sn.closing_reading) || parseFloat(sn.opening_reading)).toLocaleString('en-US', {minimumFractionDigits: 3, maximumFractionDigits: 3}),
    }));

    const { data, setData, put, processing, errors, transform } = useForm({
        nozzles: initialNozzles,
        end_time: shift.end_time ? shift.end_time.slice(0, 16) : dayjs(shift.start_time).add(1, 'day').format('YYYY-MM-DDTHH:mm'),
    });

    const [totalSalesValue, setTotalSalesValue] = useState(0);

    // Calculate totals automatically
    useEffect(() => {
        let sales = 0;
        data.nozzles.forEach(n => {
            const closing = parseFloat(String(n.closing_reading).replace(/,/g, '')) || 0;
            const opening = parseFloat(String(n.opening_reading).replace(/,/g, '')) || 0;
            const vol = closing - opening;
            if (vol > 0) {
                sales += (vol * n.price);
            }
        });
        setTotalSalesValue(sales);
    }, [data]);

    const [editingOpening, setEditingOpening] = useState({});

    const toggleEditOpening = (index) => {
        setEditingOpening(prev => ({...prev, [index]: !prev[index]}));
    };

    const handleReadingChange = (index, field, value) => {
        const newNozzles = [...data.nozzles];
        newNozzles[index][field] = value;
        setData('nozzles', newNozzles);
    };

    const handleReadingBlur = (index, field, value) => {
        const cleanValue = String(value).replace(/,/g, '');
        const val = parseFloat(cleanValue);
        if (!isNaN(val)) {
            const newNozzles = [...data.nozzles];
            newNozzles[index][field] = val.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
            setData('nozzles', newNozzles);
        }
    };

    const submit = (e) => {
        e.preventDefault();
        transform((d) => ({
            ...d,
            nozzles: d.nozzles.map(n => ({
                ...n,
                opening_reading: parseFloat(String(n.opening_reading).replace(/,/g, '')) || 0,
                closing_reading: parseFloat(String(n.closing_reading).replace(/,/g, '')) || 0
            }))
        }));
        put(route('shifts.update', shift.id));
    };

    return (
        <AuthenticatedLayout header={shift.status === 'open' ? "Close Shift" : "Update Shift"}>
            <Head title={shift.status === 'open' ? "Close Shift" : "Update Shift"} />

            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
                    <div className="bg-slate-50/80 border-b border-slate-200 p-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Operator</span>
                                <span className="font-bold text-slate-900 text-sm">{shift.employee?.name}</span>
                            </div>
                            <div>
                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Started</span>
                                <span className="font-bold text-slate-900 text-sm">{dayjs(shift.start_time).format('MMM D, h:mm A')}</span>
                            </div>
                            <div>
                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Duration</span>
                                <span className="font-bold text-slate-900 text-sm">{Math.max(0, dayjs(data.end_time).diff(dayjs(shift.start_time), 'hours'))} hrs {Math.max(0, dayjs(data.end_time).diff(dayjs(shift.start_time), 'minutes') % 60)} mins</span>
                            </div>
                            <div>
                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${shift.status === 'open' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>{shift.status}</span>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={submit} className="p-6">
                        <div className="mb-6 grid grid-cols-1 md:grid-cols-2">
                            <CommonInput
                                label="End Time"
                                type="datetime-local"
                                value={data.end_time}
                                onChange={e => setData('end_time', e.target.value)}
                                error={errors.end_time}
                            />
                        </div>
                        <div className="space-y-6">
                            {/* Meter Readings Section */}
                            <div>
                                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4 border-b pb-2">Meter Readings</h2>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                            <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                <th className="py-2 pr-4">Nozzle</th>
                                                <th className="py-2 px-4 text-right">Price</th>
                                                <th className="py-2 px-4 text-right">Opening</th>
                                                <th className="py-2 px-4 w-40">Closing</th>
                                                <th className="py-2 pl-4 text-right">Sales Val.</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {data.nozzles.map((nozzle, index) => {
                                                const closing = parseFloat(String(nozzle.closing_reading).replace(/,/g, '')) || 0;
                                                const opening = parseFloat(String(nozzle.opening_reading).replace(/,/g, '')) || 0;
                                                const volume = closing - opening;
                                                const value = volume > 0 ? (volume * nozzle.price) : 0;
                                                const isError = errors[`nozzles.${index}.closing_reading`];

                                                return (
                                                    <tr key={nozzle.id}>
                                                        <td className="py-3 pr-4">
                                                            <div className="font-bold text-slate-800">{nozzle.name}</div>
                                                            <div className="text-[10px] text-slate-500">{nozzle.pump_name} ({nozzle.fuel_name})</div>
                                                        </td>
                                                        <td className="py-3 px-4 text-right font-mono text-slate-600">
                                                            {nozzle.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <div className="flex items-center justify-end gap-2 group min-w-[120px]">
                                                                {editingOpening[index] ? (
                                                                    <div className="flex items-center gap-1">
                                                                        <CommonInput
                                                                            type="text"
                                                                            value={nozzle.opening_reading}
                                                                            onChange={(e) => handleReadingChange(index, 'opening_reading', e.target.value)}
                                                                            onBlur={(e) => handleReadingBlur(index, 'opening_reading', e.target.value)}
                                                                            size="sm"
                                                                            className="w-24 text-right"
                                                                        />
                                                                        <button onClick={() => toggleEditOpening(index)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        <span className="font-mono text-slate-600">{nozzle.opening_reading}</span>
                                                                        <button tabIndex="-1" onClick={() => toggleEditOpening(index)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-primary transition-opacity" title="Edit Opening Reading">
                                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <CommonInput
                                                                type="text"
                                                                value={nozzle.closing_reading}
                                                                onChange={(e) => handleReadingChange(index, 'closing_reading', e.target.value)}
                                                                onBlur={(e) => handleReadingBlur(index, 'closing_reading', e.target.value)}
                                                                size="sm"
                                                                error={isError}
                                                            />
                                                        </td>
                                                        <td className="py-3 pl-4 text-right font-mono font-bold text-slate-800">
                                                            {value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot>
                                            <tr className="border-t border-slate-200 bg-slate-50/50">
                                                <td colSpan="4" className="py-3 pr-4 text-right font-bold text-slate-700 text-xs uppercase tracking-widest">Calculated Total Sales:</td>
                                                <td className="py-3 pl-4 text-right font-mono font-bold text-emerald-600 text-sm">
                                                    {totalSalesValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                            <div className="flex justify-end pt-4 border-t border-slate-100">
                                <CommonButton
                                    variant="primary"
                                    type="submit"
                                    processing={processing}
                                    disabled={processing}
                                    className={`px-4 py-1.5 text-xs ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {processing ? 'Processing...' : (shift.status === 'open' ? 'Close Meter Readings' : 'Update Readings')}
                                </CommonButton>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
