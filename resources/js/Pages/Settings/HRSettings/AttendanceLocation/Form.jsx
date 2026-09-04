import React, { useState } from 'react';
import { useForm, Link } from '@inertiajs/react';
import HRSettingsLayout from '../HRSettingsLayout';
import CommonButton from '@/Components/CommonButton';
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
                    <Link
                        href={route('settings.hr.attendance-locations.index')}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-wider"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        Back to Locations
                    </Link>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="text-sm font-bold text-slate-800">{isEditing ? 'Edit Location' : 'Create Location'}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Specify geographical bounds for attendance check-ins.</p>
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

                        <div className="border border-slate-100 p-5 rounded-lg bg-slate-50/30">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h4 className="text-xs font-bold text-slate-800">Global Access</h4>
                                    <p className="text-xs text-slate-500 mt-0.5">If enabled, all employees can check in from this location. If disabled, you must assign specific staff.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer scale-90 shrink-0 ml-4">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={data.is_global}
                                        onChange={() => setData('is_global', !data.is_global)}
                                    />
                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                            </div>

                            {!data.is_global && (
                                <div className="mt-4 border-t border-slate-200/60 pt-4">
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Assign Staff Members</label>
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

                        <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                            <CommonButton variant="secondary" href={route('settings.hr.attendance-locations.index')}>
                                Cancel
                            </CommonButton>
                            <CommonButton type="submit" variant="primary" processing={processing}>
                                {isEditing ? 'Save Changes' : 'Create Location'}
                            </CommonButton>
                        </div>
                    </form>
                </div>
            </div>
        </HRSettingsLayout>
    );
}
