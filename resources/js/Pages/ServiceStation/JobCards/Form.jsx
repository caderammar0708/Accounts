import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import CommonButton from '@/Components/CommonButton';
import CommonInput from '@/Components/CommonInput';
import SearchableSelect from '@/Components/SearchableSelect';

export default function Form({ auth, jobCard, customers }) {
    const { data, setData, post, put, processing, errors } = useForm({
        customer_id: jobCard?.customer_id || '',
        device_id: jobCard?.device_id || '',
        service_date: jobCard?.service_date ? jobCard.service_date.split('T')[0] : new Date().toISOString().split('T')[0],
        complaint: jobCard?.complaint || '',
        technician_assigned: jobCard?.technician_assigned || '',
        estimated_delivery_date: jobCard?.estimated_delivery_date ? jobCard.estimated_delivery_date.split('T')[0] : '',
        estimated_cost: jobCard?.estimated_cost || '',
        status: jobCard?.status || 'Pending',
        photos: []
    });

    const isEdit = !!jobCard;

    const selectedCustomer = customers.find(c => c.id === data.customer_id);
    const availableDevices = selectedCustomer?.devices || [];

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEdit) {
            put(route('job-cards.update', jobCard.id));
        } else {
            post(route('job-cards.store'));
        }
    };

    return (
        <AuthenticatedLayout user={auth.user} header={isEdit ? "Edit Job Registration" : "New Job Registration"}>
            <Head title={isEdit ? "Edit Job Registration" : "New Job Registration"} />

            <div className="py-8">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 space-y-6">
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Customer</label>
                                    <SearchableSelect
                                        options={customers.map(c => ({ value: c.id, label: c.display_name }))}
                                        value={data.customer_id}
                                        onChange={val => {
                                            setData(prev => ({
                                                ...prev, 
                                                customer_id: val,
                                                device_id: ''
                                            }));
                                        }}
                                        placeholder="Search Customer..."
                                        error={errors.customer_id}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Device / Vehicle</label>
                                    <SearchableSelect
                                        options={availableDevices.map(d => ({
                                            value: d.id,
                                            label: `${d.brand || ''} ${d.model || ''} ${d.vehicle_number ? `(${d.vehicle_number})` : ''}`.trim()
                                        }))}
                                        value={data.device_id}
                                        onChange={val => setData('device_id', val)}
                                        placeholder="Search Device..."
                                        error={errors.device_id}
                                        disabled={!data.customer_id}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <CommonInput
                                    label="Service Date"
                                    type="date"
                                    value={data.service_date}
                                    onChange={e => setData('service_date', e.target.value)}
                                    required
                                    error={errors.service_date}
                                />
                                
                                <CommonInput
                                    type="select"
                                    label="Status"
                                    value={data.status}
                                    onChange={e => setData('status', e.target.value)}
                                    error={errors.status}
                                    options={[
                                        { value: 'Pending', label: 'Pending' },
                                        { value: 'Diagnosing', label: 'Diagnosing' },
                                        { value: 'Waiting for Parts', label: 'Waiting for Parts' },
                                        { value: 'In Progress', label: 'In Progress' },
                                        { value: 'Ready', label: 'Ready' },
                                        { value: 'Delivered', label: 'Delivered' },
                                        { value: 'Cancelled', label: 'Cancelled' }
                                    ]}
                                />
                            </div>

                            <div>
                                <CommonInput
                                    label="Complaint / Issue"
                                    type="textarea"
                                    value={data.complaint}
                                    onChange={e => setData('complaint', e.target.value)}
                                    placeholder="Describe the issue..."
                                    error={errors.complaint}
                                    className="min-h-[120px]"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <CommonInput
                                    label="Technician Assigned"
                                    value={data.technician_assigned}
                                    onChange={e => setData('technician_assigned', e.target.value)}
                                    error={errors.technician_assigned}
                                />
                                <CommonInput
                                    label="Estimated Delivery Date"
                                    type="date"
                                    value={data.estimated_delivery_date}
                                    onChange={e => setData('estimated_delivery_date', e.target.value)}
                                    error={errors.estimated_delivery_date}
                                />
                                <CommonInput
                                    label="Estimated Cost"
                                    type="number"
                                    step="0.01"
                                    value={data.estimated_cost}
                                    onChange={e => setData('estimated_cost', e.target.value)}
                                    error={errors.estimated_cost}
                                />
                            </div>

                            {!isEdit && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Photos Before Repair</label>
                                    <input 
                                        type="file" 
                                        multiple
                                        accept="image/*"
                                        onChange={e => setData('photos', e.target.files)}
                                        className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                </div>
                            )}

                        </div>
                        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                            <Link href={route('job-cards.index')}>
                                <CommonButton variant="ghost" type="button">Cancel</CommonButton>
                            </Link>
                            <CommonButton variant="primary" type="submit" processing={processing}>
                                {isEdit ? 'Update' : 'Create'} Job Registration
                            </CommonButton>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
