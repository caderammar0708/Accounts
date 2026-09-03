import React from 'react';
import { useForm, Link } from '@inertiajs/react';
import HRSettingsLayout from '../HRSettingsLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import CommonInput from '@/Components/CommonInput';
import SearchableSelect from '@/Components/SearchableSelect';

export default function Form({ leaveType }) {
    const isEditing = !!leaveType;

    const limitTypeOptions = [
        { value: 'month', label: 'Per Month' },
        { value: 'week', label: 'Per Week' }
    ];

    const { data, setData, post, put, processing, errors } = useForm({
        name: leaveType?.name || '',
        days_per_year: leaveType?.days_per_year || '',
        is_short_leave: !!leaveType?.is_short_leave,
        short_leave_limit_type: leaveType?.short_leave_limit_type || 'month',
        short_leave_limit: leaveType?.short_leave_limit || '',
        short_leave_time_minutes: leaveType?.short_leave_time_minutes || '',
        comment: leaveType?.comment || '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (isEditing) {
            put(route('settings.hr.leave-types.update', leaveType.id), {
                preserveScroll: true,
            });
        } else {
            post(route('settings.hr.leave-types.store'), {
                preserveScroll: true,
            });
        }
    };

    return (
        <HRSettingsLayout activeTab="leave-types">
            <div className="max-w-4xl pb-12">
                <div className="mb-4">
                    <Link href={route('settings.hr.leave-types.index')} className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                        &larr; Back to Leave Types
                    </Link>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 border-b border-slate-200 rounded-t-xl">
                        <h3 className="text-base font-bold text-white tracking-wide">{isEditing ? 'Edit Leave Type' : 'Create Leave Type'}</h3>
                        <p className="text-slate-400 text-xs mt-0.5">Configure leave balances and constraints.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <CommonInput
                                label="Leave Name"
                                name="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                error={errors.name}
                                placeholder="e.g. Annual Leave, Casual Leave"
                                required
                            />
                            <CommonInput
                                label="Total Days Per Year"
                                type="number"
                                name="days_per_year"
                                value={data.days_per_year}
                                onChange={(e) => setData('days_per_year', e.target.value)}
                                error={errors.days_per_year}
                                min="0"
                                required
                            />
                        </div>

                        <div className="bg-slate-50 border border-slate-100 p-5 rounded-lg">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800">Is this a Short Leave?</h4>
                                    <p className="text-xs text-slate-500">Enable this if the leave type is used for partial-day absences (e.g. 1 or 2 hours).</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setData('is_short_leave', !data.is_short_leave)}
                                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${data.is_short_leave ? 'bg-indigo-600' : 'bg-slate-300'}`}
                                >
                                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${data.is_short_leave ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            {data.is_short_leave && (
                                <div className="mt-4 border-t border-slate-200 pt-4 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">Limit Period</label>
                                            <SearchableSelect
                                                options={limitTypeOptions}
                                                value={limitTypeOptions.find(o => o.value === data.short_leave_limit_type)}
                                                onChange={(s) => setData('short_leave_limit_type', s?.value)}
                                                placeholder="Select..."
                                            />
                                            {errors.short_leave_limit_type && <span className="text-red-500 text-xs mt-1 block">{errors.short_leave_limit_type}</span>}
                                        </div>
                                        <CommonInput
                                            label={`Maximum allowed per ${data.short_leave_limit_type || 'period'}`}
                                            type="number"
                                            value={data.short_leave_limit}
                                            onChange={(e) => setData('short_leave_limit', e.target.value)}
                                            error={errors.short_leave_limit}
                                            min="1"
                                            placeholder="e.g. 2"
                                        />
                                    </div>
                                    <div className="w-full md:w-1/2">
                                        <CommonInput
                                            label="Time allowed per request (Minutes)"
                                            type="number"
                                            value={data.short_leave_time_minutes}
                                            onChange={(e) => setData('short_leave_time_minutes', e.target.value)}
                                            error={errors.short_leave_time_minutes}
                                            min="1"
                                            placeholder="e.g. 120"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Description / Guidelines (Optional)</label>
                            <textarea
                                value={data.comment}
                                onChange={(e) => setData('comment', e.target.value)}
                                className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-3"
                                rows="3"
                                placeholder="Add notes about this leave type for employees..."
                            ></textarea>
                            {errors.comment && <span className="text-red-500 text-xs mt-1 block">{errors.comment}</span>}
                        </div>

                        <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                            <PrimaryButton type="submit" disabled={processing}>
                                {isEditing ? 'Save Changes' : 'Create Leave Type'}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </HRSettingsLayout>
    );
}
