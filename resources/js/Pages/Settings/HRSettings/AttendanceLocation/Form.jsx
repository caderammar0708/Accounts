import React, { useState } from 'react';
import { useForm, Link } from '@inertiajs/react';
import HRSettingsLayout from '../HRSettingsLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import CommonInput from '@/Components/CommonInput';
import SearchableSelect from '@/Components/SearchableSelect';

export default function Form({ location, staffMembers }) {
    const isEditing = !!location;
    
    const staffOptions = staffMembers.map(staff => ({
        value: staff.id,
        label: staff.name,
    }));

    const { data, setData, post, put, processing, errors } = useForm({
        name: location?.name || '',
        latitude: location?.latitude || '',
        longitude: location?.longitude || '',
        allowed_radius: location?.allowed_radius || 100,
        is_global: isEditing ? !!location.is_global : true,
        staff_ids: location?.staff?.map(s => s.id) || [],
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (isEditing) {
            put(route('settings.hr.attendance-locations.update', location.id), {
                preserveScroll: true,
            });
        } else {
            post(route('settings.hr.attendance-locations.store'), {
                preserveScroll: true,
            });
        }
    };

    return (
        <HRSettingsLayout activeTab="attendance-location">
            <div className="max-w-3xl pb-12">
                <div className="mb-4">
                    <Link href={route('settings.hr.attendance-locations.index')} className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                        &larr; Back to Locations
                    </Link>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 border-b border-slate-200 rounded-t-xl">
                        <h3 className="text-base font-bold text-white tracking-wide">{isEditing ? 'Edit Location' : 'Create Location'}</h3>
                        <p className="text-slate-400 text-xs mt-0.5">Specify geographical bounds for attendance check-ins.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <CommonInput
                            label="Location Name"
                            name="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            error={errors.name}
                            required
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <CommonInput
                                label="Latitude"
                                type="number"
                                step="any"
                                value={data.latitude}
                                onChange={(e) => setData('latitude', e.target.value)}
                                error={errors.latitude}
                                required
                            />
                            <CommonInput
                                label="Longitude"
                                type="number"
                                step="any"
                                value={data.longitude}
                                onChange={(e) => setData('longitude', e.target.value)}
                                error={errors.longitude}
                                required
                            />
                        </div>

                        <CommonInput
                            label="Allowed Radius (Meters)"
                            type="number"
                            value={data.allowed_radius}
                            onChange={(e) => setData('allowed_radius', e.target.value)}
                            error={errors.allowed_radius}
                            required
                        />

                        <div className="bg-slate-50 border border-slate-100 p-5 rounded-lg">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800">Global Access</h4>
                                    <p className="text-xs text-slate-500">If enabled, all employees can check in from this location. If disabled, you must assign specific staff.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setData('is_global', !data.is_global)}
                                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${data.is_global ? 'bg-indigo-600' : 'bg-slate-300'}`}
                                >
                                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${data.is_global ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            {!data.is_global && (
                                <div className="mt-4 border-t border-slate-200 pt-4">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Assign Staff Members</label>
                                    <SearchableSelect
                                        options={staffOptions}
                                        value={staffOptions.filter(opt => data.staff_ids.includes(opt.value))}
                                        onChange={(selected) => setData('staff_ids', selected ? selected.map(s => s.value) : [])}
                                        isMulti
                                        placeholder="Select employees..."
                                    />
                                    {errors.staff_ids && <span className="text-red-500 text-xs mt-1 block">{errors.staff_ids}</span>}
                                </div>
                            )}
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end gap-3">
                            <PrimaryButton type="submit" disabled={processing}>
                                {isEditing ? 'Save Changes' : 'Create Location'}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </HRSettingsLayout>
    );
}
