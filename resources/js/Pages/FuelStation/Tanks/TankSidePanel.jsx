import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import SlideOver from '@/Components/SlideOver';
import CommonInput from '@/Components/CommonInput';
import FormSection from '@/Components/FormSection';

export default function TankSidePanel({ isOpen, onClose, tank, fuelTypes = [] }) {
    const isEdit = !!tank;

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        item_id: '',
        capacity: '',
        min_level: '',
    });

    useEffect(() => {
        if (isOpen) {
            clearErrors();
            if (isEdit && tank) {
                setData({
                    name: tank.name || '',
                    item_id: tank.item_id || '',
                    capacity: tank.capacity || '',
                    min_level: tank.min_level || '',
                });
            } else {
                reset();
            }
        }
    }, [isOpen, tank]);

    const submit = (e) => {
        e.preventDefault();
        
        const payload = {
            ...data,
            capacity: String(data.capacity).replace(/,/g, ''),
            min_level: String(data.min_level).replace(/,/g, ''),
        };

        const options = {
            onSuccess: () => {
                onClose();
            },
        };

        if (isEdit) {
            put(route('tanks.update', tank.id), options);
        } else {
            post(route('tanks.store'), options);
        }
    };

    return (
        <SlideOver
            isOpen={isOpen}
            onClose={onClose}
            title={isEdit ? "Edit Tank" : "New Tank"}
        >
            <form onSubmit={submit} className="space-y-6">
                <FormSection title="Tank Details">
                    <div className="space-y-4">
                        <CommonInput
                            label="Tank Name"
                            value={data.name}
                            onChange={e => setData('name', e.target.value)}
                            error={errors.name}
                            required
                            placeholder="e.g. Tank 1 (Petrol)"
                        />

                        <CommonInput 
                            label="Fuel Type / Grade"
                            type="select"
                            value={data.item_id}
                            onChange={e => setData('item_id', e.target.value)}
                            error={errors.item_id}
                            required
                        >
                            <option value="">Select Fuel Type...</option>
                            {fuelTypes.map(ft => (
                                <option key={ft.id} value={ft.id}>{ft.name}</option>
                            ))}
                        </CommonInput>

                        <div className="grid grid-cols-2 gap-4">
                            <CommonInput
                                label="Total Capacity (L)"
                                value={data.capacity}
                                onChange={e => setData('capacity', e.target.value)}
                                error={errors.capacity}
                                required
                                placeholder="e.g. 10000"
                            />
                            <CommonInput
                                label="Safety Min Level (L)"
                                value={data.min_level}
                                onChange={e => setData('min_level', e.target.value)}
                                error={errors.min_level}
                                required
                                placeholder="e.g. 1000"
                            />
                        </div>
                    </div>
                </FormSection>

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
                        {processing ? 'Saving...' : 'Save Tank'}
                    </button>
                </div>
            </form>
        </SlideOver>
    );
}
