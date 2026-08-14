import React, { useEffect, useState } from 'react';
import { useForm } from '@inertiajs/react';
import SlideOver from '@/Components/SlideOver';
import CommonInput from '@/Components/CommonInput';
import FormSection from '@/Components/FormSection';

export default function PumpSidePanel({ isOpen, onClose, pump, tanks = [] }) {
    const isEdit = !!pump;

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        nozzles: [],
    });

    useEffect(() => {
        if (isOpen) {
            clearErrors();
            if (isEdit && pump) {
                setData({
                    name: pump.name || '',
                    nozzles: pump.nozzles ? pump.nozzles.map(n => ({ id: n.id, name: n.name, tank_id: n.tank_id || '' })) : [],
                });
            } else {
                setData({
                    name: '',
                    nozzles: [{ id: null, name: 'Nozzle 1', tank_id: '' }],
                });
            }
        }
    }, [isOpen, pump]);

    const handleAddNozzle = () => {
        setData('nozzles', [
            ...data.nozzles,
            { id: null, name: `Nozzle ${data.nozzles.length + 1}`, tank_id: '' }
        ]);
    };

    const handleRemoveNozzle = (index) => {
        const newNozzles = [...data.nozzles];
        newNozzles.splice(index, 1);
        setData('nozzles', newNozzles);
    };

    const handleNozzleChange = (index, field, value) => {
        const newNozzles = [...data.nozzles];
        newNozzles[index][field] = value;
        setData('nozzles', newNozzles);
    };

    const submit = (e) => {
        e.preventDefault();
        
        const options = {
            onSuccess: () => {
                onClose();
            },
        };

        if (isEdit) {
            put(route('pumps.update', pump.id), options);
        } else {
            post(route('pumps.store'), options);
        }
    };

    return (
        <SlideOver
            isOpen={isOpen}
            onClose={onClose}
            title={isEdit ? "Edit Pump" : "New Pump"}
            size="md"
        >
            <form onSubmit={submit} className="space-y-6">
                <FormSection title="Pump Details">
                    <div className="space-y-4">
                        <CommonInput
                            label="Pump Name"
                            value={data.name}
                            onChange={e => setData('name', e.target.value)}
                            error={errors.name}
                            required
                            placeholder="e.g. Pump 1"
                        />
                    </div>
                </FormSection>

                <FormSection title="Linked Nozzles">
                    <div className="space-y-4">
                        {data.nozzles.map((nozzle, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-md">
                                <div className="flex-1 space-y-3">
                                    <CommonInput
                                        label="Nozzle Name"
                                        value={nozzle.name}
                                        onChange={e => handleNozzleChange(index, 'name', e.target.value)}
                                        required
                                        placeholder="e.g. Nozzle 1"
                                    />
                                    <CommonInput 
                                        label="Link to Tank"
                                        type="select"
                                        value={nozzle.tank_id}
                                        onChange={e => handleNozzleChange(index, 'tank_id', e.target.value)}
                                        required
                                    >
                                        <option value="">Select Tank...</option>
                                        {tanks.map(tank => (
                                            <option key={tank.id} value={tank.id}>
                                                {tank.name} {tank.fuel_type ? `(${tank.fuel_type.name})` : ''}
                                            </option>
                                        ))}
                                    </CommonInput>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveNozzle(index)}
                                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded mt-5 transition-colors"
                                    title="Remove Nozzle"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={handleAddNozzle}
                            className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1 mt-2"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                            Add Another Nozzle
                        </button>
                    </div>
                </FormSection>

                {errors.nozzles && <p className="text-xs text-red-600">{errors.nozzles}</p>}

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={processing}
                        className="px-4 py-2 text-sm font-medium text-white bg-slate-900 border border-transparent rounded-md hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-50"
                    >
                        {processing ? 'Saving...' : 'Save Pump'}
                    </button>
                </div>
            </form>
        </SlideOver>
    );
}
