import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CommonButton from '@/Components/CommonButton';
import SearchableSelect from '@/Components/SearchableSelect';
import CommonInput from '@/Components/CommonInput';
import dayjs from 'dayjs';

export default function Create({ shift, employees, pumps, lastEndTime }) {
    const isEdit = !!shift;

    const initialNozzles = isEdit && shift.shift_nozzles ? shift.shift_nozzles.map(sn => ({
        id: sn.nozzle_id,
        opening_reading: (parseFloat(sn.opening_reading) || 0).toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })
    })) : [];

    const { data, setData, post, put, processing, errors, transform } = useForm({
        employee_id: isEdit ? shift.employee_id : '',
        start_time: isEdit ? shift.start_time.slice(0, 16) : dayjs(lastEndTime || undefined).format('YYYY-MM-DDTHH:mm'),
        nozzles: initialNozzles
    });

    const handleToggleNozzle = (nozzle) => {
        const existingIndex = data.nozzles.findIndex(n => n.id === nozzle.id);
        if (existingIndex >= 0) {
            // Remove
            const newNozzles = [...data.nozzles];
            newNozzles.splice(existingIndex, 1);
            setData('nozzles', newNozzles);
        } else {
            // Add
            setData('nozzles', [...data.nozzles, {
                id: nozzle.id,
                opening_reading: (parseFloat(nozzle.last_reading) || 0).toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })
            }]);
        }
    };

    const handleReadingChange = (nozzleId, value) => {
        const newNozzles = [...data.nozzles];
        const index = newNozzles.findIndex(n => n.id === nozzleId);
        if (index >= 0) {
            newNozzles[index].opening_reading = value;
            setData('nozzles', newNozzles);
        }
    };

    const handleReadingBlur = (nozzleId, value) => {
        const newNozzles = [...data.nozzles];
        const index = newNozzles.findIndex(n => n.id === nozzleId);
        if (index >= 0) {
            const cleanValue = String(value).replace(/,/g, '');
            const val = parseFloat(cleanValue);
            if (!isNaN(val)) {
                newNozzles[index].opening_reading = val.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
                setData('nozzles', newNozzles);
            }
        }
    };

    const submit = (e) => {
        e.preventDefault();
        transform((d) => ({
            ...d,
            nozzles: d.nozzles.map(n => ({
                ...n,
                opening_reading: parseFloat(String(n.opening_reading).replace(/,/g, '')) || 0
            }))
        }));
        if (isEdit) {
            put(route('shifts.update-active', shift.id));
        } else {
            post(route('shifts.store'));
        }
    };

    return (
        <AuthenticatedLayout header={isEdit ? "Edit Active Shift" : "Start Shift"}>
            <Head title={isEdit ? "Edit Active Shift" : "Start Shift"} />

            <div className="py-4 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
                <form onSubmit={submit} className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4 border-b pb-2">Shift Operator</h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="w-full">
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                                    Select Operator
                                </label>
                                <SearchableSelect
                                    options={employees.map(e => ({ value: e.id, label: e.name }))}
                                    value={data.employee_id}
                                    onChange={(val) => setData('employee_id', val)}
                                    placeholder="Search employees..."
                                    error={errors.employee_id}
                                />
                                {errors.employee_id && <p className="mt-1 text-[10px] text-red-500">{errors.employee_id}</p>}
                            </div>
                            <div className="w-full">
                                <CommonInput
                                    label="Start Time"
                                    type="datetime-local"
                                    value={data.start_time}
                                    onChange={e => setData('start_time', e.target.value)}
                                    error={errors.start_time}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center justify-between border-b pb-2 mb-4">
                            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Assign Pumps & Nozzles</h2>
                            {errors.nozzles && <p className="text-[10px] text-red-500 font-bold">{errors.nozzles}</p>}
                        </div>

                        <div className="space-y-6">
                            {pumps.map(pump => (
                                <div key={pump.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <h3 className="font-bold text-slate-800">{pump.name}</h3>
                                        <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-mono uppercase">
                                            {pump.tank?.fuel_type?.name}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {pump.nozzles.map(nozzle => {
                                            const isSelected = data.nozzles.some(n => n.id === nozzle.id);
                                            const nozzleData = data.nozzles.find(n => n.id === nozzle.id);

                                            return (
                                                <div
                                                    key={nozzle.id}
                                                    className={`border rounded-lg p-3 transition-colors ${isSelected ? 'border-primary-500 bg-primary-50/20' : 'border-slate-200 bg-white'}`}
                                                >
                                                    <label className="flex items-center gap-3 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => handleToggleNozzle(nozzle)}
                                                            className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 h-4 w-4"
                                                        />
                                                        <div>
                                                            <span className="font-bold text-slate-700 text-sm">{nozzle.name}</span>
                                                            <span className="block text-[10px] text-slate-500">Last Reading: {parseFloat(nozzle.last_reading || 0).toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</span>
                                                        </div>
                                                    </label>

                                                    {isSelected && (
                                                        <div className="mt-3 pt-3 border-t border-primary-100">
                                                            <CommonInput
                                                                label="Opening Reading"
                                                                type="text"
                                                                value={nozzleData.opening_reading}
                                                                onChange={(e) => handleReadingChange(nozzle.id, e.target.value)}
                                                                onBlur={(e) => handleReadingBlur(nozzle.id, e.target.value)}
                                                                size="sm"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <CommonButton variant="primary" type="submit" processing={processing} className="px-4 py-1.5 text-xs">
                            {processing ? (isEdit ? 'Updating...' : 'Starting...') : (isEdit ? 'Update Shift' : 'Start Shift')}
                        </CommonButton>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
